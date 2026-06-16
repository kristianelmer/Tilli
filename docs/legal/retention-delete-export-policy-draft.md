# Retention, Deletion, and Export Policy Draft

Status: draft for founder/legal review  
Last updated: 2026-06-16  
Blocks: #72 remains open until human/legal signoff

## Policy Goal

Users must be able to leave Talli without lock-in, while Talli avoids deleting
records that may need to be retained as accounting documentation, filing evidence,
or audit/security logs.

## Export Before Cancellation

Before cancellation/deletion, Talli should generate a company archive containing:

- company identity;
- memberships and reviewer comments;
- opening balances and shareholders;
- ledger entries;
- holding actions and investment positions;
- documents metadata and object references;
- filing previews, submissions, feedback, receipts, and overrides;
- billing/refund state;
- audit events relevant to the selected company/year.

If document bytes are missing from object storage, export must include explicit
missing-object warnings.

## Retention Classes

| Data class | Default handling |
| --- | --- |
| Source documents and balance documentation | Retain according to accounting-document retention requirements before deletion. |
| Filing payloads, feedback, receipts | Retain as filing evidence while statutory/accounting retention applies. |
| Ledger, holding actions, opening balances | Retain with accounting records. |
| Audit/security logs | Retain long enough for security, dispute, and compliance evidence. |
| Billing records | Retain as needed for accounting, tax, refund, and dispute handling. |
| Invitations and notification outbox | Retain short operational history; redact/expire tokens where possible. |
| Auth/account profile | Delete/anonymize when no longer needed, subject to retained company/audit references. |

Exact periods require legal/accounting review before launch.

## Deletion Rules

- User-requested deletion must not silently remove statutory accounting records.
- Company deletion requires fresh MFA/step-up and human security review.
- Destructive deletion must be audited.
- Cancelled companies should enter retention hold where legal retention applies.
- Final deletion should happen only after retention hold expires or legal review approves.

## Required Human Review Before Publication

- Confirm exact retention periods.
- Confirm whether Talli or customer is responsible for retained archive after export.
- Confirm deletion/anonymization approach for user ids in retained audit records.
- Confirm cancellation copy and support runbook.
