# RF-1086 Code Evidence Register

Status: live-scope decision register  
Last updated: 2026-06-16  
Target issue: #80

This register separates simulation support from production live filing support.
Talli may render XML for broader RF-1086 cases when the XML validates against
public XSDs, but live filing must not use unverified transaction-code meanings.

## Official Evidence Reviewed

- Skatteetaten RF-1086 API documentation:
  https://skatteetaten.github.io/api-dokumentasjon/api/innrapportering-aksjonaerregisteroppgave
- Skatteetaten RF-1086 examples:
  https://www.skatteetaten.no/bedrift-og-organisasjon/rapportering-og-bransjer/aksjonarregisteroppgaven/eksempler-pa-utfylling-av-aksjonarregisteroppgaven/
- Local copies of official XSDs:
  - `docs/filing/aksjonaerregisteroppgaveHovedskjema.xsd`
  - `docs/filing/aksjonaerregisteroppgaveUnderskjema.xsd`

## Decisions

| Event | Field | Code | Decision | Evidence |
| --- | --- | --- | --- | --- |
| `stiftelse` | `AksjerNyutstedteStiftelseMvType-datadef-17670` / `AksjeErvervType-datadef-17745` | `N` | Verified for live scope | Observed in Skatteetaten public API example. |
| `kjop` | `AksjeErvervType-datadef-17745` | `K` | Excluded from live scope | Public sources identify purchase label/reporting position, but XSD is free text and code value is not proven. |
| `salg` | `AksjerArvMvOmsattType-datadef-17753` | `S` | Excluded from live scope | Public sources identify sale label/reporting position, but XSD is free text and code value is not proven. |
| `utbytte` | `AksjeUtbytteHendelsestype-datadef-36564` | `U` | Excluded from live scope | Public sources identify dividend field/shape, but code value is not proven. |

## Live Filing Rule

RF-1086 production/live submission is limited to stiftelse/no-activity cases until
Skatteetaten code-list evidence or test-environment acceptance proves the
purchase, sale, and dividend code values.

If a case contains excluded events, production preparation returns:

- code: `RF1086_EVENT_UNSUPPORTED`
- user meaning: live filing is not enabled for these RF-1086 event types yet
- allowed fallback: simulation, XML export, archive, or external/accountant filing

## What Can Clear Exclusions Later

- Official Skatteetaten code list naming the exact code values.
- Official updated API docs with code-value examples for K/S/U meanings.
- Skatteetaten test-environment acceptance with submitted payload, accepted
  feedback, receipt/reference id, reviewer, and date recorded.
