from __future__ import annotations

import tempfile
import unittest
from datetime import UTC, datetime, timedelta

from holding_core.security import SensitiveAction, StepUpContext, assert_step_up, security_requirements
from holding_core.workspace import (
    Actor,
    CompanyIdentity,
    WorkspaceStore,
    attach_document,
    confirm_company_identity,
    create_signed_document_url,
)


class SecurityBaselineTest(unittest.TestCase):
    def test_sensitive_actions_require_step_up_or_explicit_human_gates(self) -> None:
        requirements = {item.action: item for item in security_requirements()}

        self.assertTrue(requirements[SensitiveAction.PRODUCTION_FILING].requires_mfa)
        self.assertTrue(requirements[SensitiveAction.PRODUCTION_FILING].requires_security_review)
        self.assertTrue(requirements[SensitiveAction.PRODUCTION_FILING].requires_production_credentials_gate)

        with self.assertRaisesRegex(PermissionError, "MFA"):
            assert_step_up(SensitiveAction.ARCHIVE_EXPORT, StepUpContext(actor_id="owner"))
        with self.assertRaisesRegex(PermissionError, "fresh MFA"):
            assert_step_up(
                SensitiveAction.PRODUCTION_FILING,
                StepUpContext(
                    actor_id="owner",
                    mfa_verified_at=datetime.now(UTC) - timedelta(minutes=20),
                    security_review_approved=True,
                    production_credentials_enabled=True,
                ),
            )
        with self.assertRaisesRegex(PermissionError, "production credentials"):
            assert_step_up(
                SensitiveAction.PRODUCTION_FILING,
                StepUpContext(
                    actor_id="owner",
                    mfa_verified_at=datetime.now(UTC),
                    security_review_approved=True,
                    production_credentials_enabled=False,
                ),
            )

    def test_document_signed_urls_are_tenant_access_controlled(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            store = WorkspaceStore(f"{temp_dir}/workspace.json")
            store.upsert_actor(Actor(id="owner", email="owner@example.com", name="Owner"))
            store.upsert_actor(Actor(id="outsider", email="out@example.com", name="Outsider"))
            store.create_workspace(
                "owner",
                CompanyIdentity(org_number="314259521", name="Demo Holding AS", entity_type="AS"),
            )
            confirm_company_identity(store, "owner", "314259521")
            workspace = attach_document(
                store,
                "owner",
                "314259521",
                income_year=2025,
                document_type="bank_statement",
                name="Bank.pdf",
                linked_to="årsregnskap",
                storage_key="companies/314259521/2025/bank.pdf",
            )

            signed = create_signed_document_url(store, "owner", "314259521", workspace.documents[0].id)

            self.assertTrue(signed.url.startswith("talli-signed://companies/314259521/"))
            with self.assertRaises(PermissionError):
                create_signed_document_url(store, "outsider", "314259521", workspace.documents[0].id)


if __name__ == "__main__":
    unittest.main()
