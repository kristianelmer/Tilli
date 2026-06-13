from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, ConfigDict, ValidationError

from holding_core.models import FilingCase
from holding_core.readiness import assess_rf1086_readiness
from holding_core.rf1086 import generate_rf1086


class ValidationCaseResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    case_path: str
    case_id: str | None
    outcome: str
    assumptions: list[str]
    issues: list[str]
    generated_documents: int


class ValidationReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filing: str
    source: str
    limitations: list[str]
    cases: list[ValidationCaseResult]


PUBLIC_DATA_LIMITATIONS = [
    "Public and synthetic data cannot prove voucher completeness.",
    "Public and synthetic data cannot prove exact bank transaction classification.",
    "Public and synthetic data cannot prove parity with Fiken or accountant-submitted payloads.",
]


def run_rf1086_validation(case_paths: list[str | Path], *, source: str = "public/synthetic") -> ValidationReport:
    results = [_run_case(Path(path)) for path in case_paths]
    return ValidationReport(
        filing="aksjonærregisteroppgaven",
        source=source,
        limitations=PUBLIC_DATA_LIMITATIONS,
        cases=results,
    )


def _run_case(path: Path) -> ValidationCaseResult:
    assumptions = ["RF-1086 launch subset", "No production authority submission", "Official XSD validation is separate"]
    try:
        case = FilingCase.from_json_file(path)
    except (OSError, ValueError, ValidationError) as error:
        return ValidationCaseResult(
            case_path=str(path),
            case_id=None,
            outcome="blocked",
            assumptions=assumptions,
            issues=[f"Case validation failed: {error}"],
            generated_documents=0,
        )

    readiness = assess_rf1086_readiness(case)
    if not readiness.is_ready:
        return ValidationCaseResult(
            case_path=str(path),
            case_id=case.case_id,
            outcome="blocked",
            assumptions=assumptions,
            issues=[issue.message for issue in readiness.issues],
            generated_documents=0,
        )

    documents = generate_rf1086(case)
    warnings = [issue.message for issue in readiness.issues if issue.level == "warning"]
    return ValidationCaseResult(
        case_path=str(path),
        case_id=case.case_id,
        outcome="warning" if warnings else "pass",
        assumptions=assumptions,
        issues=warnings,
        generated_documents=1 + len(documents.underskjema_xml),
    )
