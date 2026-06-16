# Talli Data Processing Agreement Draft

Status: draft for founder/legal review  
Last updated: 2026-06-16  
Blocks: #72 remains open until human/legal signoff

## Parties and Roles

For business customers, the customer company is expected to be controller for
company accounting data, documents, and filing content. Talli is expected to be
processor for hosting, processing, validating, and submitting data according to
customer instructions.

This role model must be reviewed before production launch.

## Processing Instructions

Talli may process customer data to:

- maintain accounting workspace and archive;
- store source documents;
- run deterministic filing validation and readiness gates;
- generate filing previews and payloads;
- submit filings when production gates are enabled and user confirms;
- store authority feedback/receipts;
- provide support, billing, security monitoring, export, and cancellation flows.

Talli must not use customer accounting data for unrelated purposes without a
separate legal basis and customer-facing disclosure.

## Security Measures

Minimum controls:

- Supabase Auth and RLS for tenant isolation;
- private object storage and short-lived signed URLs for documents;
- MFA/step-up for sensitive actions;
- audit events for sensitive actions, invites, document access, posting, overrides,
  billing, submissions, feedback, receipts, exports, and deletion;
- production secrets outside repo/client env;
- backup/restore test before production filing;
- least-privilege support/operator access.

## Subprocessors

Draft subprocessors:

- Supabase
- Vercel
- payment provider, once selected
- email provider, once selected
- public authority systems used for filing/access flows

Final DPA must name subprocessors, purpose, location, and update notice process.

## Deletion and Return

On cancellation, Talli should provide archive export before deletion. Some data
may remain under accounting-document retention or audit obligations. Deletion
process must distinguish:

- account/auth data;
- company workspace data;
- accounting documents;
- filing payloads and receipts;
- billing records;
- audit/security logs.

## Required Human Review Before Publication

- Legal reviewer confirms controller/processor role.
- Processor/subprocessor table completed.
- Security reviewer confirms technical measures are true in production.
- Founder approves customer-facing deletion/return obligations.
