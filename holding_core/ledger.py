from __future__ import annotations

from datetime import UTC, date, datetime
from enum import StrEnum
from typing import Annotated
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator


Money = Annotated[float, Field(ge=0)]


class EntryStatus(StrEnum):
    DRAFT = "draft"
    POSTED = "posted"


class AuditAction(StrEnum):
    DRAFT_CREATED = "draft_created"
    DRAFT_UPDATED = "draft_updated"
    DRAFT_DELETED = "draft_deleted"
    ENTRY_POSTED = "entry_posted"
    ENTRY_REVERSED = "entry_reversed"


class LedgerLine(BaseModel):
    model_config = ConfigDict(extra="forbid")

    account: str
    description: str
    debit: Money = 0
    credit: Money = 0

    @model_validator(mode="after")
    def validate_one_sided_amount(self) -> "LedgerLine":
        if self.debit and self.credit:
            raise ValueError("ledger line cannot have both debit and credit")
        if not self.debit and not self.credit:
            raise ValueError("ledger line must have debit or credit")
        return self


class DraftEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(default_factory=lambda: str(uuid4()))
    company_id: str
    entry_date: date
    memo: str
    source: str
    lines: list[LedgerLine]
    status: EntryStatus = EntryStatus.DRAFT

    @model_validator(mode="after")
    def validate_balanced(self) -> "DraftEntry":
        _assert_balanced(self.lines)
        return self


class PostedEntry(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    id: str
    company_id: str
    entry_date: date
    memo: str
    source: str
    lines: tuple[LedgerLine, ...]
    status: EntryStatus = EntryStatus.POSTED
    posted_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    reverses_entry_id: str | None = None


class AuditEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: AuditAction
    entry_id: str
    at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    message: str


class NarrowLedger:
    def __init__(self) -> None:
        self._drafts: dict[str, DraftEntry] = {}
        self._posted: dict[str, PostedEntry] = {}
        self._audit: list[AuditEvent] = []

    @property
    def drafts(self) -> tuple[DraftEntry, ...]:
        return tuple(self._drafts.values())

    @property
    def posted_entries(self) -> tuple[PostedEntry, ...]:
        return tuple(self._posted.values())

    @property
    def audit_events(self) -> tuple[AuditEvent, ...]:
        return tuple(self._audit)

    def create_draft(self, entry: DraftEntry) -> DraftEntry:
        if entry.id in self._drafts or entry.id in self._posted:
            raise ValueError("entry id already exists")
        self._drafts[entry.id] = entry
        self._record(AuditAction.DRAFT_CREATED, entry.id, "Draft entry created.")
        return entry

    def update_draft(self, entry_id: str, *, memo: str | None = None, lines: list[LedgerLine] | None = None) -> DraftEntry:
        draft = self._drafts.get(entry_id)
        if draft is None:
            raise ValueError("only existing draft entries can be updated")
        updated = draft.model_copy(update={key: value for key, value in {"memo": memo, "lines": lines}.items() if value is not None})
        _assert_balanced(updated.lines)
        self._drafts[entry_id] = updated
        self._record(AuditAction.DRAFT_UPDATED, entry_id, "Draft entry updated.")
        return updated

    def delete_draft(self, entry_id: str) -> None:
        if entry_id not in self._drafts:
            raise ValueError("only existing draft entries can be deleted")
        del self._drafts[entry_id]
        self._record(AuditAction.DRAFT_DELETED, entry_id, "Draft entry deleted.")

    def post(self, entry_id: str) -> PostedEntry:
        draft = self._drafts.pop(entry_id, None)
        if draft is None:
            raise ValueError("only draft entries can be posted")
        posted = PostedEntry(
            id=draft.id,
            company_id=draft.company_id,
            entry_date=draft.entry_date,
            memo=draft.memo,
            source=draft.source,
            lines=tuple(draft.lines),
        )
        self._posted[posted.id] = posted
        self._record(AuditAction.ENTRY_POSTED, posted.id, "Entry posted.")
        return posted

    def reverse_posted(self, entry_id: str, *, entry_date: date, memo: str) -> PostedEntry:
        original = self._posted.get(entry_id)
        if original is None:
            raise ValueError("only posted entries can be reversed")
        reversal = DraftEntry(
            company_id=original.company_id,
            entry_date=entry_date,
            memo=memo,
            source=f"reversal:{entry_id}",
            lines=[
                LedgerLine(
                    account=line.account,
                    description=f"Reversal: {line.description}",
                    debit=line.credit,
                    credit=line.debit,
                )
                for line in original.lines
            ],
        )
        posted = PostedEntry(
            id=reversal.id,
            company_id=reversal.company_id,
            entry_date=reversal.entry_date,
            memo=reversal.memo,
            source=reversal.source,
            lines=tuple(reversal.lines),
            reverses_entry_id=entry_id,
        )
        self._posted[posted.id] = posted
        self._record(AuditAction.ENTRY_REVERSED, entry_id, f"Entry reversed by {posted.id}.")
        self._record(AuditAction.ENTRY_POSTED, posted.id, "Reversal entry posted.")
        return posted

    def filing_source_entries(self, company_id: str) -> tuple[PostedEntry, ...]:
        return tuple(entry for entry in self._posted.values() if entry.company_id == company_id)

    def _record(self, action: AuditAction, entry_id: str, message: str) -> None:
        self._audit.append(AuditEvent(action=action, entry_id=entry_id, message=message))


def _assert_balanced(lines: list[LedgerLine] | tuple[LedgerLine, ...]) -> None:
    if len(lines) < 2:
        raise ValueError("journal entry must have at least two lines")
    debit = round(sum(line.debit for line in lines), 2)
    credit = round(sum(line.credit for line in lines), 2)
    if debit != credit:
        raise ValueError("journal entry must balance")
