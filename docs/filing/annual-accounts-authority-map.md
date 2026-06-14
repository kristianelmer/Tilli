# Årsregnskap Authority Map

Status: source-backed map for simulation and validation  
Research date: 2026-06-14  
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

## Production Blockers

- Confirm exact Altinn 3/Regnskapsregisteret machine-submission API contract.
- Confirm whether owner-managed direct filing can use ID-porten-only, system-user-only, or hybrid flow.
- Confirm required payload schemas and attachment restrictions for a small holding AS.
- Confirm feedback and receipt retrieval behavior.
- Validate in test environment before production.
