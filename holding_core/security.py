from __future__ import annotations

from datetime import UTC, datetime, timedelta
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class SensitiveAction(StrEnum):
    PRODUCTION_FILING = "production_filing"
    CONFIRM_AUTHORITY = "confirm_authority"
    INVITE_REVIEWER = "invite_reviewer"
    CHANGE_ROLE = "change_role"
    DOCUMENT_DOWNLOAD = "document_download"
    ARCHIVE_EXPORT = "archive_export"
    BILLING_ADMIN = "billing_admin"
    COMPANY_DELETE = "company_delete"


class StepUpContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    actor_id: str
    mfa_verified_at: datetime | None = None
    security_review_approved: bool = False
    production_credentials_enabled: bool = False


class StepUpRequirement(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: SensitiveAction
    requires_mfa: bool
    requires_security_review: bool
    requires_production_credentials_gate: bool
    max_mfa_age_minutes: int = 15


SENSITIVE_ACTION_REQUIREMENTS: tuple[StepUpRequirement, ...] = (
    StepUpRequirement(
        action=SensitiveAction.PRODUCTION_FILING,
        requires_mfa=True,
        requires_security_review=True,
        requires_production_credentials_gate=True,
    ),
    StepUpRequirement(
        action=SensitiveAction.CONFIRM_AUTHORITY,
        requires_mfa=True,
        requires_security_review=False,
        requires_production_credentials_gate=False,
    ),
    StepUpRequirement(
        action=SensitiveAction.INVITE_REVIEWER,
        requires_mfa=True,
        requires_security_review=False,
        requires_production_credentials_gate=False,
    ),
    StepUpRequirement(
        action=SensitiveAction.CHANGE_ROLE,
        requires_mfa=True,
        requires_security_review=False,
        requires_production_credentials_gate=False,
    ),
    StepUpRequirement(
        action=SensitiveAction.DOCUMENT_DOWNLOAD,
        requires_mfa=False,
        requires_security_review=False,
        requires_production_credentials_gate=False,
    ),
    StepUpRequirement(
        action=SensitiveAction.ARCHIVE_EXPORT,
        requires_mfa=True,
        requires_security_review=False,
        requires_production_credentials_gate=False,
    ),
    StepUpRequirement(
        action=SensitiveAction.BILLING_ADMIN,
        requires_mfa=True,
        requires_security_review=False,
        requires_production_credentials_gate=False,
    ),
    StepUpRequirement(
        action=SensitiveAction.COMPANY_DELETE,
        requires_mfa=True,
        requires_security_review=True,
        requires_production_credentials_gate=False,
    ),
)


def security_requirements() -> tuple[StepUpRequirement, ...]:
    return SENSITIVE_ACTION_REQUIREMENTS


def assert_step_up(action: SensitiveAction, context: StepUpContext, *, now: datetime | None = None) -> None:
    requirement = next(item for item in SENSITIVE_ACTION_REQUIREMENTS if item.action == action)
    current_time = now or datetime.now(UTC)
    if requirement.requires_mfa:
        if context.mfa_verified_at is None:
            raise PermissionError(f"{action.value} requires MFA step-up")
        age = current_time - context.mfa_verified_at
        if age > timedelta(minutes=requirement.max_mfa_age_minutes):
            raise PermissionError(f"{action.value} requires fresh MFA step-up")
    if requirement.requires_security_review and not context.security_review_approved:
        raise PermissionError(f"{action.value} requires human security review")
    if requirement.requires_production_credentials_gate and not context.production_credentials_enabled:
        raise PermissionError(f"{action.value} requires production credentials to be explicitly enabled")
