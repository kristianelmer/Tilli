# Skattemelding for AS Authority Map

Status: source-backed map for simulation and validation  
Research date: 2026-06-14  
Target filing: `skattemelding for AS` / company tax return

This map defines what Talli can validate from public sources before production company-tax-return filing. It is not a complete production integration spec.

## Sources

Primary sources:

- Skatteetaten company tax return page: https://www.skatteetaten.no/bedrift-og-organisasjon/skatt/skattemelding-naringsdrivende/selskap/
- Skatteetaten `skattemelding upersonlig` API docs: https://skatteetaten.github.io/api-dokumentasjon/api/skattemeldingupersonlig
- Raw Skatteetaten API docs: https://raw.githubusercontent.com/Skatteetaten/api-dokumentasjon/main/docs/api/skattemeldingupersonlig.md
- Skatteetaten `skattemeldingen` specification repository: https://github.com/Skatteetaten/skattemeldingen
- Altinn legacy/company tax return overview: https://info.altinn.no/skjemaoversikt/skatteetaten/skattemelding-for-formues-og-inntektsskatt-aksjeselskap-mv/

## Public Filing Surface

Skatteetaten states that companies must retrieve and submit the tax return with business specification through an accounting or year-end system.

The public `skattemelding upersonlig` API documentation describes a data API that delivers information in a business tax return. It is not a direct filing API for Talli's production submission flow, but it is useful for data shape and authority vocabulary.

The Skatteetaten `skattemeldingen` repository contains system-supplier material for tax return and business specification integration. Its README states that it covers persons, sole proprietorships, and companies, and that it contains:

- Docs for information model, API, test, validations, and texts.
- Source files for XSDs, code lists, request/response envelopes, calculations, and examples.
- `skattemeldingUpersonlig_v1` XSD for AS 2021.
- Request and response envelope XSDs.
- Validation result XSDs.
- Example file for `upersonligSkattemeldingV1.xml`.

Altinn's legacy overview states that company tax return consists of a main tax-return form and several attachment forms, for example business specification/næringsoppgave. It also states role requirements for filling, signing, and auditor cases.

## API and Access Notes

The `skattemelding upersonlig` API docs state:

- API v4 delivers tax returns for 2024 and 2025.
- OpenAPI is in SwaggerHub and is authoritative if it differs from the docs page.
- Scope: `skatteetaten:skattemeldingupersonlig`.
- Access requires Skatteetaten approval/right package and legal basis; the API contains confidential information.
- The API is not adapted for system-user solution and display in an end-user system.
- Error codes include authentication, authorization, validation input, data-format, missing tax return, missing organization, and unsupported format cases.
- Test data is listed for the service in Skatteetaten's external test environment.

Production implication:

- Talli's current tax return preview cannot be treated as a production filing payload.
- The `skattemelding upersonlig` API is useful for model/validation research but does not by itself prove direct filing capability.
- Production filing must use the current Skatteetaten system-supplier submission flow and current schemas, not the simplified preview model.

## Talli Launch Subset

Supported for validation:

- Simple Norwegian holding AS.
- Dividend income under clear `fritaksmetoden`.
- 3 percent income-recognition add-back for qualifying dividends.
- Simple admin costs.
- No VAT/payroll/customer invoicing.
- No group contribution.
- No foreign tax credit.
- No complex shareholder loan case.

Blocked or unsupported:

- Unclear `fritaksmetoden` classification.
- Group contributions.
- Advanced loss carry-forward workflows.
- Foreign withholding/tax credit.
- Controlled transactions requiring advanced reporting.
- Company-to-personal-shareholder loans without accountant review.
- Audit or auditor-signature-dependent cases.

## Mapping to Current Engine

Current engine coverage:

- Uses posted ledger entries: covered.
- Calculates dividend 3 percent add-back from structured action metadata: partial.
- Estimates tax at 22 percent: simulation only.
- Blocks company-to-shareholder receivable: partial.
- Produces simulated receipt: simulation only.

Missing before production:

- Current Skatteetaten submission payload/schema mapping.
- Næringsspesifikasjon field mapping.
- Attachment/vedlegg handling.
- Validation service integration.
- Skatteetaten feedback mapping.
- Official receipt/status storage.
- Official test-environment acceptance.

## Production Blockers

- Identify the exact current submission API/flow for company tax return, separate from the `skattemelding upersonlig` data API.
- Confirm the current XSD/JSON schemas and code lists for the relevant income year.
- Map Talli ledger/tax concepts to `skattemelding` and `næringsspesifikasjon` fields.
- Validate generated payloads against official schemas and test environment.
- Confirm access package, Maskinporten/Altinn delegation, signing, feedback, and receipt behavior for owner-managed filing.
