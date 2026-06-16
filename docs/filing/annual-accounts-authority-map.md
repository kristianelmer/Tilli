# Årsregnskap Authority Map

Status: source-backed map for simulation and validation  
Research date: 2026-06-16  
Target filing: `årsregnskap` / RR-0002  

This map defines what Talli can validate from public sources before production annual-accounts filing. It is not a complete production integration spec.

## Sources

Primary sources:

- Altinn RR-0002 form page: https://info.altinn.no/skjemaoversikt/bronnoysundregistrene/arsregnskap/
- Brønnøysundregistrene annual accounts page: https://www.brreg.no/en/submission-of-annual-accounts/
- Altinn annual accounts guidance: https://info.altinn.no/en/start-and-run-business/accounts-and-auditing/accounting/annual-accounts/
- Brønnøysund API documentation index for Regnskapsregisteret: https://brreg.github.io/docs/apidokumentasjon/regnskapsregisteret/
- Digdir/Altinn 3 update for annual accounts system submission: https://samarbeid.digdir.no/altinn/nytt-fra-programmet-nye-altinn/2723

## Public Filing Surface

RR-0002 is the Altinn annual-accounts form used to submit annual accounts to Regnskapsregisteret. Altinn states that complete annual accounts must be submitted by companies with accounting obligations, normally no later than 31 July to avoid late filing fees.

Altinn states that RR-0002 consists of:

- Hovedskjema.
- Regnskapsskjema with accounting currency and accounting figures for income statement and balance sheet.
- Notes for small enterprises, including at minimum number of annual full-time equivalents.
- Attachments where relevant.

Altinn annual-accounts guidance states that a complete annual-account set normally includes:

- Income statement.
- Balance sheet.
- Notes.
- Annual report, not for small enterprises.
- Sustainability reporting, only when required.
- Cash-flow analysis, not for small enterprises.
- Auditor's report, if audit obligation applies.

Brønnøysund states that after processing, the enterprise receives a decision in Altinn inbox, and that annual accounts and tax return are separate reporting obligations.

## Machine Submission Surface

Brønnøysund documentation links Regnskapsregisteret machine reporting documentation. Digdir states that a new machine submission API for annual accounts has been developed and documented, supports system user, ID-porten, and a combination where a system user can automate data filling before a person signs.

Production implications:

- Talli can model annual-account data and readiness from public sources.
- Talli cannot claim production RR-0002 filing until the exact Altinn 3/Regnskapsregisteret API contract, payload schemas, signing flow, attachment rules, and receipt/feedback behavior are validated in the appropriate test environment.
- Signering may require a person through ID-porten depending on the annual-accounts app choice; this remains a production blocker until tested for Talli's owner-managed model.

## Talli Launch Subset

Supported for validation:

- Small Norwegian holding AS.
- No audit obligation.
- One accounting year.
- Balance sheet and income statement totals from posted ledger.
- Notes represented as checklist/metadata, not full legal note generation.
- General meeting approval confirmed.
- Annual accounts not yet production-submitted.

Blocked or unsupported:

- Audit obligation.
- Annual report obligation.
- Sustainability reporting.
- Cash-flow statement obligation.
- Complex notes beyond small holding AS.
- Replacement of already submitted annual accounts.
- Non-Norwegian language annual accounts without dispensation.

## Launch Schema Decisions

These decisions are the source-backed launch schema for a simple holding AS. A row marked `blocked` must not be treated as production-ready.

| Authority requirement | Source evidence | Talli source data | Launch decision |
| --- | --- | --- | --- |
| Reporting obligation and deadline | Brønnøysund states reporting-obligated enterprises must submit a complete annual-account set by 31 July, and the tax return is a separate obligation. | `companies`, `annual_data`, `filing_readiness_snapshots` | Supported as readiness/deadline data. |
| RR-0002 main form | Altinn identifies RR-0002 as the annual-accounts form and states AS must enter audit/accounting-firm information in the main form. | `companies`, `authority_permissions`, future accountant/auditor metadata | Partially supported; exact RR-0002 payload fields are blocked. |
| Accounting currency and scale | Altinn says the accounting form requires currency and amount scale. | Ledger amounts currently stored as NOK numeric values. | Supported for NOK/whole-kroner validation only; other currencies/scales blocked. |
| Income statement figures | Altinn says accounting figures are entered in result/income statement. | `ledger_entries.lines`, annual preview totals | Partial. Current preview totals are insufficient until RR-0002 field ids are mapped. |
| Balance-sheet figures | Altinn says accounting figures are entered in balance sheet. | `ledger_entries.lines`, opening balance, investment register | Partial. Current preview totals are insufficient until RR-0002 field ids are mapped. |
| Small-enterprise notes | Altinn states small enterprises fill notes in the form and at minimum annual full-time equivalents. | `annual_data`, future note records | Blocked. Talli has no note payload model or årsverk field yet. |
| Attachments | Altinn says small enterprises with no audit obligation generally do not need annual report/cash-flow attachments, while non-small cases require notes, annual report, cash-flow statement and usually auditor report as file attachments. | `documents` metadata/object references | Supported only as readiness metadata; production attachment payload is blocked. |
| Confirmation/signing | Altinn says sender confirms the annual accounts are approved by the competent body; it then goes to signing/submission. | `annual_data.general_meeting_approved`, `authority_permissions` | Readiness supported; production signing flow blocked until Altinn 3/Regnskapsregisteret flow is tested. |
| Receipt/decision | Altinn/Brønnøysund state the enterprise receives electronic feedback/decision in Altinn inbox after processing. | `filing_submissions`, archive receipt state | Simulation only; official receipt retrieval/storage is blocked. |

## Mapping to Current Engine

Current engine coverage:

- Balance preview: partial.
- Income statement preview: partial.
- General meeting approval readiness: covered.
- Bank/document warnings: partial.
- Simulated receipt: covered for simulation only.

Missing before production:

- RR-0002 payload schema.
- Accounting-form field mapping.
- Note field mapping.
- Attachment payload handling.
- Signing model.
- Altinn/Regnskapsregisteret validation feedback.
- Official receipt storage.

Current annual preview field decisions:

| Current preview field | Authority mapping decision |
| --- | --- |
| Bank balance | Candidate balance-sheet bank/cash field; blocked until RR-0002 field id is confirmed. |
| Share investments | Candidate asset/investment field; blocked until RR-0002 field id and note implications are confirmed. |
| Share capital | Candidate equity/share-capital field; blocked until RR-0002 field id is confirmed. |
| Retained earnings | Candidate equity field; blocked until RR-0002 field id and result allocation rules are confirmed. |
| Dividend/gain income | Candidate income statement financial income; blocked until exact RR-0002 field id is confirmed. |
| Admin costs | Candidate operating/other expenses; blocked until exact RR-0002 field id is confirmed. |
| Result before tax | Derived display value only; not enough for production payload. |
| General meeting approval | Supported readiness confirmation; not enough for production signature. |

## Production Blockers

- Confirm exact Altinn 3/Regnskapsregisteret machine-submission API contract.
- Confirm whether owner-managed direct filing can use ID-porten-only, system-user-only, or hybrid flow.
- Confirm required payload schemas and attachment restrictions for a small holding AS.
- Confirm feedback and receipt retrieval behavior.
- Validate in test environment before production.

## Follow-Up Implementation Slices

1. Add `annual_accounts_payload_map` with RR-0002 field ids for simple holding AS income statement, balance sheet, currency, scale, and small-enterprise note fields.
2. Add annual-account note model, starting with annual full-time equivalents and small-enterprise note confirmations.
3. Add attachment rules for no-audit small AS versus non-small/audit cases.
4. Add Regnskapsregisteret/Altinn 3 adapter interface behind a disabled production gate.
5. Add test-environment runbook for signing, validation feedback, receipt/decision retrieval, and archive storage.
