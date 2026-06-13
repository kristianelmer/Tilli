from __future__ import annotations

import json
from datetime import UTC, date, datetime
from pathlib import Path

from pydantic import BaseModel, ConfigDict

from holding_core.ledger import PostedEntry


class DocumentRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    document_type: str
    name: str
    status: str
    storage_uri: str | None = None


class YearEndInterviewAnswers(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shares_owned_at_year_end: bool
    bought_or_sold_shares: bool
    received_dividends: bool
    declared_owner_dividends: bool
    shareholder_loans: bool
    paid_costs: bool
    bank_balance_confirmed: bool
    has_unpaid_items: bool
    general_meeting_approved: bool
    authority_to_submit_confirmed: bool


class AnnualReadinessIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    level: str
    code: str
    message: str


class AnnualReadinessResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filing: str
    status: str
    issues: list[AnnualReadinessIssue]

    @property
    def is_ready(self) -> bool:
        return self.status == "ready"


class AnnualData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_id: str
    income_year: int
    interview: YearEndInterviewAnswers
    posted_entries: tuple[PostedEntry, ...]
    documents: tuple[DocumentRecord, ...] = ()
    confirmations: tuple[str, ...] = ()

    def account_balance(self, account: str) -> float:
        debit = sum(line.debit for entry in self.posted_entries for line in entry.lines if line.account == account)
        credit = sum(line.credit for entry in self.posted_entries for line in entry.lines if line.account == account)
        return round(debit - credit, 2)

    def account_credit_balance(self, account: str) -> float:
        return round(-self.account_balance(account), 2)

    @property
    def bank_balance(self) -> float:
        return self.account_balance("1920")

    @property
    def investment_balance(self) -> float:
        return self.account_balance("1800")

    @property
    def admin_costs(self) -> float:
        cost_accounts = {"7770", "6705", "6420", "7790", "6720", "7795"}
        return round(
            sum(line.debit for entry in self.posted_entries for line in entry.lines if line.account in cost_accounts),
            2,
        )

    @property
    def dividend_income(self) -> float:
        return self.account_credit_balance("8070")

    @property
    def shareholder_loan_payable(self) -> float:
        return self.account_credit_balance("2255")

    @property
    def shareholder_loan_receivable(self) -> float:
        return self.account_balance("1370")

    @property
    def share_capital(self) -> float:
        return self.account_credit_balance("2000")

    @property
    def retained_earnings(self) -> float:
        return self.account_credit_balance("2050")

    @property
    def result_before_tax(self) -> float:
        return round(self.dividend_income - self.admin_costs, 2)

    @property
    def fritaksmetoden_add_back(self) -> float:
        total = 0.0
        for entry in self.posted_entries:
            marker = "taxable_add_back:"
            if marker in entry.source:
                raw = entry.source.split(marker, 1)[1].split(":", 1)[0]
                total += float(raw)
        return round(total, 2)


class FilingSimulation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filing: str
    preview: str
    readiness: AnnualReadinessResult
    simulated_receipt_id: str | None = None


class CompanyArchive(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_id: str
    income_year: int
    exported_at: datetime
    ledger_entries: tuple[PostedEntry, ...]
    documents: tuple[DocumentRecord, ...]
    filing_previews: tuple[str, ...]
    readiness_reports: tuple[AnnualReadinessResult, ...]
    receipts: tuple[str, ...]
    missing_document_ids: tuple[str, ...]


def build_annual_data(
    *,
    company_id: str,
    income_year: int,
    interview: YearEndInterviewAnswers,
    posted_entries: tuple[PostedEntry, ...],
    documents: tuple[DocumentRecord, ...] = (),
    confirmations: tuple[str, ...] = (),
) -> AnnualData:
    return AnnualData(
        company_id=company_id,
        income_year=income_year,
        interview=interview,
        posted_entries=posted_entries,
        documents=documents,
        confirmations=confirmations,
    )


def assess_annual_accounts_readiness(data: AnnualData) -> AnnualReadinessResult:
    issues = _common_issues(data)
    if not data.interview.general_meeting_approved:
        issues.append(_error("general_meeting_not_approved", "Generalforsamling må godkjenne årsregnskapet før filing."))
    if data.bank_balance < 0:
        issues.append(_error("negative_bank_balance", "Bankbalanse kan ikke være negativ i enkel holdingselskapssimulering."))
    return _result("årsregnskap", issues)


def assess_tax_return_readiness(data: AnnualData) -> AnnualReadinessResult:
    issues = _common_issues(data)
    if data.shareholder_loan_receivable > 0:
        issues.append(_error("shareholder_loan_receivable", "Lån fra selskap til aksjonær krever regnskapsføreravklaring."))
    return _result("skattemelding for AS", issues)


def simulate_annual_accounts(data: AnnualData) -> FilingSimulation:
    readiness = assess_annual_accounts_readiness(data)
    preview = "\n".join(
        [
            f"Årsregnskap {data.income_year}",
            f"Selskap: {data.company_id}",
            "",
            "Balanse:",
            f"- Bank: {_money(data.bank_balance)}",
            f"- Aksjeinvesteringer: {_money(data.investment_balance)}",
            f"- Aksjekapital: {_money(data.share_capital)}",
            f"- Annen egenkapital: {_money(data.retained_earnings)}",
            f"- Aksjonærlån: {_money(data.shareholder_loan_payable)}",
            "",
            "Resultat:",
            f"- Utbytte/gevinster: {_money(data.dividend_income)}",
            f"- Administrasjonskostnader: {_money(data.admin_costs)}",
            f"- Resultat før skatt: {_money(data.result_before_tax)}",
        ]
    )
    return FilingSimulation(
        filing="årsregnskap",
        preview=preview + "\n",
        readiness=readiness,
        simulated_receipt_id=f"sim-arsregnskap-{data.company_id}-{data.income_year}" if readiness.is_ready else None,
    )


def simulate_tax_return(data: AnnualData) -> FilingSimulation:
    readiness = assess_tax_return_readiness(data)
    estimated_tax_basis = round(data.admin_costs + data.fritaksmetoden_add_back, 2)
    estimated_tax = round(estimated_tax_basis * 0.22, 2)
    preview = "\n".join(
        [
            f"Skattemelding for AS {data.income_year}",
            f"Selskap: {data.company_id}",
            "",
            "Skattegrunnlag:",
            f"- Regnskapsmessig resultat før skatt: {_money(data.result_before_tax)}",
            f"- 3 prosent inntektsføring etter fritaksmetoden: {_money(data.fritaksmetoden_add_back)}",
            f"- Forenklet skattegrunnlag i simulering: {_money(estimated_tax_basis)}",
            f"- Estimert skatt 22 prosent: {_money(estimated_tax)}",
        ]
    )
    return FilingSimulation(
        filing="skattemelding for AS",
        preview=preview + "\n",
        readiness=readiness,
        simulated_receipt_id=f"sim-skattemelding-{data.company_id}-{data.income_year}" if readiness.is_ready else None,
    )


def build_company_archive(
    data: AnnualData,
    *,
    filing_simulations: tuple[FilingSimulation, ...],
    receipts: tuple[str, ...] = (),
) -> CompanyArchive:
    missing = tuple(document.id for document in data.documents if document.status.startswith("missing"))
    return CompanyArchive(
        company_id=data.company_id,
        income_year=data.income_year,
        exported_at=datetime.now(UTC),
        ledger_entries=data.posted_entries,
        documents=data.documents,
        filing_previews=tuple(simulation.preview for simulation in filing_simulations),
        readiness_reports=tuple(simulation.readiness for simulation in filing_simulations),
        receipts=receipts + tuple(
            simulation.simulated_receipt_id for simulation in filing_simulations if simulation.simulated_receipt_id
        ),
        missing_document_ids=missing,
    )


def write_company_archive(archive: CompanyArchive, out_path: str | Path) -> Path:
    path = Path(out_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(archive.model_dump(mode="json"), ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def _common_issues(data: AnnualData) -> list[AnnualReadinessIssue]:
    issues: list[AnnualReadinessIssue] = []
    if not data.interview.bank_balance_confirmed:
        issues.append(_warning("bank_not_confirmed", "Bankbalanse er ikke bekreftet."))
    if data.interview.has_unpaid_items:
        issues.append(_error("unpaid_items_not_supported", "Ubetalte poster er ikke støttet i enkel holdingselskapssimulering."))
    if not data.interview.authority_to_submit_confirmed:
        issues.append(_error("authority_not_confirmed", "Innsendingsrett må bekreftes før filing."))
    if any(document.status.startswith("missing") for document in data.documents):
        issues.append(_warning("missing_documents", "Ett eller flere dokumenter mangler eller er akseptert med advarsel."))
    return issues


def _result(filing: str, issues: list[AnnualReadinessIssue]) -> AnnualReadinessResult:
    status = "blocked" if any(issue.level == "error" for issue in issues) else "ready"
    return AnnualReadinessResult(filing=filing, status=status, issues=issues)


def _error(code: str, message: str) -> AnnualReadinessIssue:
    return AnnualReadinessIssue(level="error", code=code, message=message)


def _warning(code: str, message: str) -> AnnualReadinessIssue:
    return AnnualReadinessIssue(level="warning", code=code, message=message)


def _money(value: float) -> str:
    return f"{value:.2f} kr"
