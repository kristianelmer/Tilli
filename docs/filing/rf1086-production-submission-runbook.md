# RF-1086 Production Submission Runbook

Status: production blocked until human review and official validation  
Last updated: 2026-06-14  
Target filing: `aksjonærregisteroppgaven` / RF-1086

This runbook defines the path from local RF-1086 simulation to live submission. It is not permission to enable production filing. Live filing remains disabled until authority access, test-environment evidence, RF-1086 code decisions, billing, security, and human review gates are complete.

## Official Anchors

- Skatteetaten RF-1086 API docs: https://skatteetaten.github.io/api-dokumentasjon/api/innrapportering-aksjonaerregisteroppgave
- Skatteetaten RF-1086 page: https://www.skatteetaten.no/skjema/rf-1086-aksjonarregisteroppgaven/
- Skatteetaten end-user-system transition note: https://www.skatteetaten.no/bedrift-og-organisasjon/rapportering-og-bransjer/aksjonarregisteroppgaven/
- Skatteetaten setup guidance for re-established services: https://www.skatteetaten.no/samarbeidspartnere/reetablering-altinn/systemleverandor/oppkobling/
- Altinn system-user guide: https://docs.altinn.studio/en/authorization/guides/resource-owner/system-user/
- RF-1086 phase 0 map: [aksjonaerregisteroppgaven-phase-0-map.md](./aksjonaerregisteroppgaven-phase-0-map.md)

## Required Authority Access

Before production filing can be enabled:

- Talli must be registered as a relevant end-user-system/system supplier where required.
- Talli must have Maskinporten client setup for the correct organization.
- Talli must have access to scope `skatteetaten:innrapporteringaksjonaerregisteroppgave`.
- Altinn/system-user flow must be tested for a supported company and delegated right/access package.
- Test submissions must use synthetic/test data where required by Skatteetaten/Altinn/Digdir guidance.
- Production credentials must be separated from local/dev credentials and explicitly enabled only after security sign-off.

## Submission Flow

The local integration seam in `holding_core.rf1086_submission` models the production path:

1. Build RF-1086 readiness from the deterministic case model.
2. Block if readiness has hard errors.
3. Block if billing/subscription/filing-package gate is not satisfied.
4. Block if required RF-1086 transaction code decisions still have `production_blocker=True`.
5. In production mode, require fresh MFA, human security review, and explicit production credentials gate.
6. Require owner authority confirmation and final preview confirmation.
7. Prepare API calls for:
   - `POST 1086H` hovedskjema.
   - `POST 1086U` underskjema per shareholder.
   - `POST bekreft` with underskjema count.
   - `GET dokumenter` / feedback retrieval seam.
8. Store feedback document references and official receipt/reference ids in submission state.

## Idempotency Policy

Skatteetaten requires an `idempotencyKey` UUID and repeated POSTs with the same body/key must reuse the first response. Talli policy:

- Store endpoint, body hash, and idempotency key for each logical authority call.
- Reuse the same key only for the same endpoint and same body hash.
- Generate a new key if the endpoint or body changes.
- Never retry a changed body under an old key.
- Never create duplicate logical submissions for the same confirmed preview.

This is covered by `holding_core.submission.register_api_call` and RF-1086 submission tests.

## Failure Handling

Retryable failures:

- Authentication/token expiry.
- Temporary authority outage.
- Network timeout before final authority state is known.

Blocked failures:

- Missing authorization.
- Readiness mismatch.
- Underskjema count mismatch.
- Unverified RF-1086 code values.
- Missing authority confirmation or final preview confirmation.
- Production security gate missing.

Every failure must preserve the submission state and be visible to the user/operator without silently resubmitting.

## Current RF-1086 Production Blockers

As of 2026-06-14:

- `N` for stiftelse has evidence status `verified`; it is observed in Skatteetaten public API example and has no local RF-1086 code-value blocker.
- `K` for kjøp has evidence status `still_blocked`.
- `S` for salg has evidence status `still_blocked`.
- `U` for utbytte has evidence status `still_blocked`.

The public examples identify labels and reporting positions, but the public XSDs do not prove these exact code values. The blocker can be cleared only by official docs/code list or Skatteetaten test-environment acceptance recorded in the code-decision registry and filing docs.

User-facing blocker text must explain that production submission is unavailable until official RF-1086 code evidence is confirmed.

## Human Review Before Live Filing

Production credentials/live filing may be enabled only after a named reviewer signs off:

- Authority access and system-user flow tested.
- RF-1086 code blockers cleared or unsupported cases excluded from live filing.
- Test-environment submission and feedback retrieval completed with evidence.
- Security baseline and restore test completed.
- Launch claims reviewed.
- Support/refund policy confirmed.

Until then, Talli may generate previews, XML, validation reports, and simulated submission state only.
