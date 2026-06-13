from __future__ import annotations

from datetime import date
import json
import tempfile
import unittest
from pathlib import Path

from holding_core.annual import (
    DocumentRecord,
    YearEndInterviewAnswers,
    assess_annual_accounts_readiness,
    assess_tax_return_readiness,
    build_annual_data,
    build_company_archive,
    simulate_annual_accounts,
    simulate_tax_return,
    write_company_archive,
)
from holding_core.holding_actions import (
    AdminCostCategory,
    AdminCostInput,
    DividendReceivedInput,
    DocumentStatus,
    OpeningBalanceInput,
    ShareholderLoanDirection,
    ShareholderLoanInput,
    TaxTreatment,
    build_admin_cost_entry,
    build_dividend_received,
    build_opening_balance_entry,
    build_shareholder_loan,
)
from holding_core.ledger import NarrowLedger


class AnnualSimulationTest(unittest.TestCase):
    def test_year_end_shared_data_and_filing_readiness(self) -> None:
        data = _simple_annual_data()

        annual_ready = assess_annual_accounts_readiness(data)
        tax_ready = assess_tax_return_readiness(data)

        self.assertEqual(annual_ready.status, "ready")
        self.assertEqual(tax_ready.status, "ready")
        self.assertEqual(data.bank_balance, 128510)
        self.assertEqual(data.dividend_income, 100000)
        self.assertEqual(data.admin_costs, 1490)
        self.assertEqual(data.fritaksmetoden_add_back, 3000)

    def test_annual_accounts_simulation_preview_and_receipt(self) -> None:
        simulation = simulate_annual_accounts(_simple_annual_data())

        self.assertEqual(simulation.filing, "årsregnskap")
        self.assertIn("Årsregnskap 2025", simulation.preview)
        self.assertIn("Bank: 128510.00 kr", simulation.preview)
        self.assertIn("Resultat før skatt: 98510.00 kr", simulation.preview)
        self.assertEqual(simulation.readiness.status, "ready")
        self.assertEqual(simulation.simulated_receipt_id, "sim-arsregnskap-314259521-2025")

    def test_annual_accounts_blocks_unapproved_general_meeting(self) -> None:
        data = _simple_annual_data(
            interview=_interview(general_meeting_approved=False),
        )

        simulation = simulate_annual_accounts(data)

        self.assertEqual(simulation.readiness.status, "blocked")
        self.assertIsNone(simulation.simulated_receipt_id)
        self.assertIn("general_meeting_not_approved", [issue.code for issue in simulation.readiness.issues])

    def test_tax_return_simulation_includes_fritaksmetoden_add_back(self) -> None:
        simulation = simulate_tax_return(_simple_annual_data())

        self.assertEqual(simulation.filing, "skattemelding for AS")
        self.assertIn("3 prosent inntektsføring etter fritaksmetoden: 3000.00 kr", simulation.preview)
        self.assertIn("Estimert skatt 22 prosent: 987.80 kr", simulation.preview)
        self.assertEqual(simulation.readiness.status, "ready")
        self.assertEqual(simulation.simulated_receipt_id, "sim-skattemelding-314259521-2025")

    def test_tax_return_blocks_company_to_shareholder_loan(self) -> None:
        ledger = NarrowLedger()
        loan = build_shareholder_loan(
            ShareholderLoanInput(
                company_id="314259521",
                loan_date=date(2025, 7, 1),
                amount=10000,
                direction=ShareholderLoanDirection.COMPANY_TO_CORPORATE_SHAREHOLDER,
                counterparty_name="OWNER HOLDING AS",
                document_status=DocumentStatus.ATTACHED,
            )
        )
        ledger.create_draft(loan)
        ledger.post(loan.id)
        data = build_annual_data(
            company_id="314259521",
            income_year=2025,
            interview=_interview(shareholder_loans=True),
            posted_entries=ledger.posted_entries,
        )

        simulation = simulate_tax_return(data)

        self.assertEqual(simulation.readiness.status, "blocked")
        self.assertIn("shareholder_loan_receivable", [issue.code for issue in simulation.readiness.issues])

    def test_archive_export_contains_ledger_documents_previews_and_missing_document_marker(self) -> None:
        data = _simple_annual_data(
            documents=(
                DocumentRecord(id="doc-1", document_type="bank_statement", name="Bank.pdf", status="attached"),
                DocumentRecord(
                    id="doc-2",
                    document_type="receipt",
                    name="Missing receipt",
                    status="missing_accepted_warning",
                ),
            )
        )
        annual = simulate_annual_accounts(data)
        tax = simulate_tax_return(data)
        archive = build_company_archive(data, filing_simulations=(annual, tax))

        self.assertEqual(archive.company_id, "314259521")
        self.assertEqual(len(archive.ledger_entries), 3)
        self.assertEqual(len(archive.filing_previews), 2)
        self.assertIn("doc-2", archive.missing_document_ids)
        self.assertIn("sim-arsregnskap-314259521-2025", archive.receipts)

        with tempfile.TemporaryDirectory() as temp_dir:
            path = write_company_archive(archive, Path(temp_dir) / "archive.json")
            payload = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(payload["company_id"], "314259521")
            self.assertEqual(payload["missing_document_ids"], ["doc-2"])


def _simple_annual_data(
    *,
    interview: YearEndInterviewAnswers | None = None,
    documents: tuple[DocumentRecord, ...] = (),
):
    ledger = NarrowLedger()
    for draft in (
        build_opening_balance_entry(
            OpeningBalanceInput(
                company_id="314259521",
                opening_date=date(2025, 1, 1),
                bank_balance=30000,
                share_capital=30000,
            )
        ),
        build_dividend_received(
            DividendReceivedInput(
                company_id="314259521",
                declared_date=date(2025, 4, 1),
                paid_date=date(2025, 4, 15),
                gross_amount=100000,
                paying_company_name="PORTFOLIO AS",
                linked_investment_id="portfolio-as",
                tax_treatment=TaxTreatment.FRITAKSMETODEN,
                bank_matched=True,
                document_status=DocumentStatus.ATTACHED,
            )
        ).entry,
        build_admin_cost_entry(
            AdminCostInput(
                company_id="314259521",
                paid_date=date(2025, 5, 1),
                amount=1490,
                payee="Talli AS",
                category=AdminCostCategory.SOFTWARE,
                document_status=DocumentStatus.ATTACHED,
            )
        ),
    ):
        ledger.create_draft(draft)
        ledger.post(draft.id)

    return build_annual_data(
        company_id="314259521",
        income_year=2025,
        interview=interview or _interview(),
        posted_entries=ledger.posted_entries,
        documents=documents,
        confirmations=("authority_confirmed",),
    )


def _interview(
    *,
    shareholder_loans: bool = False,
    general_meeting_approved: bool = True,
) -> YearEndInterviewAnswers:
    return YearEndInterviewAnswers(
        shares_owned_at_year_end=True,
        bought_or_sold_shares=False,
        received_dividends=True,
        declared_owner_dividends=False,
        shareholder_loans=shareholder_loans,
        paid_costs=True,
        bank_balance_confirmed=True,
        has_unpaid_items=False,
        general_meeting_approved=general_meeting_approved,
        authority_to_submit_confirmed=True,
    )


if __name__ == "__main__":
    unittest.main()
