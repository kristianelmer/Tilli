# Talli Privacy Policy Draft

Status: draft for founder/legal review  
Last updated: 2026-06-16  
Blocks: #72 remains open until human/legal signoff

## Data Talli Processes

Talli processes data needed to operate a holding-first accounting and filing app:

- account data: email, auth identifiers, session/security state;
- company data: organization number, company name, address, entity type, status;
- membership data: owner/reviewer/read-only roles, invitations, accepted access;
- accounting data: ledger entries, holding actions, bank CSV rows, opening balances;
- documents: accounting source documents, storage keys, metadata, signed download events;
- filing data: previews, validation issues, overrides, confirmations, submissions, receipts;
- billing data: plan, subscription state, filing-package state, refund eligibility;
- audit logs: security, role, document, ledger, billing, filing, and support-relevant events.

## Purpose

Data is processed to:

- provide secure company workspaces;
- maintain company accounting records and document archive;
- evaluate filing readiness;
- prepare, simulate, validate, and, where enabled, submit statutory filings;
- store authority feedback and receipts;
- manage billing and refunds;
- provide support and security monitoring;
- export company archives and handle cancellation/deletion requests.

## Access

Access is role-scoped:

- owner can manage company data, documents, filing, billing, reviewers, and export;
- reviewer can read authorized data and add review comments;
- read-only can read authorized data but cannot mutate company resources;
- non-members are denied by RLS and storage policies.

Support/operator access must be limited to operational need, audited, and
reviewed before production launch.

## Processors and External Services

Expected processors/services:

- Supabase/Postgres/Auth/Storage for data, auth, RLS, and documents;
- Vercel for app hosting and runtime logs;
- payment provider when real payment collection is enabled;
- email provider when notification delivery is enabled;
- Norwegian public authority systems when direct filing is enabled.

Final processor list must be updated before public launch.

## Retention

Accounting documentation, filing receipts, and audit trails may need retention
even after cancellation. Deletion requests must be evaluated against accounting
documentation requirements and legal retention duties. See
`docs/legal/retention-delete-export-policy-draft.md`.

## User Rights

Users may request access, correction, export, restriction, or deletion where
applicable. Talli should provide company archive export before cancellation and
explain any data that cannot be deleted immediately because of statutory
retention obligations.

## Required Human Review Before Publication

- Identify controller/legal entity.
- Confirm processor list and subprocessors.
- Confirm data transfer basis if any data leaves EEA/Norway.
- Confirm support/operator access model.
- Legal/privacy reviewer approves final wording.
