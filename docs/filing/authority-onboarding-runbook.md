# Authority Onboarding Runbook

Status: onboarding not started — production filing blocked for all obligations
Last updated: 2026-06-27
Covers: `aksjonærregisteroppgaven` (RF-1086, #81), `årsregnskap` (RR-0002, #84), `skattemelding for AS` (#87)

This runbook sequences the real-world steps that take Talli from "no authority access" to
"accepted test-environment submission" for each filing obligation, and maps every step to the
gate Talli already enforces in code. It is a working checklist, not permission to enable
production filing: live filing stays disabled until each obligation's gate is satisfied.

The actual account registrations, certificate purchases, and authority delegations are
real-world actions only the founder/org can perform. Talli's role is this runbook plus the
in-app evidence records described in [How this maps to Talli's gates](#how-this-maps-to-tallis-gates).

## Official Anchors

- Maskinporten docs: https://docs.digdir.no/docs/Maskinporten/
- Samarbeidsportalen (client registration): https://samarbeid.digdir.no/
- Altinn system user (systembruker) guide: https://docs.altinn.studio/en/authorization/guides/system-vendor/system-user/
- Altinn access packages (tilgangspakker): https://info.altinn.no/en/help/profile/single-services-and-rights/
- Tenor synthetic test data: https://www.skatteetaten.no/skjema/testdata/
- Brønnøysund start-a-business: https://www.brreg.no/bedrift/
- Per-obligation maps: [rf1086-production-submission-runbook.md](./rf1086-production-submission-runbook.md),
  [annual-accounts-authority-map.md](./annual-accounts-authority-map.md),
  [company-tax-return-authority-map.md](./company-tax-return-authority-map.md)

## The shared spine (do once)

These steps are prerequisites for all three obligations. Do them once; the per-obligation
scopes (next section) attach on top.

### Step 1 — Register the operating entity as an ENK (get an organisasjonsnummer)

Talli's operating entity holds the Maskinporten client and acts as the system supplier. It does
**not** have to be an AS — an **enkeltpersonforetak (ENK)** has an organisasjonsnummer and is
sufficient for the Maskinporten / Altinn / virksomhetssertifikat integration. (Talli's
*customers* must still be AS — that is the product's scope; this step is only about Talli itself.)

> Already have an active ENK? **Reuse it** — an existing, still-registered ENK's org number
> satisfies every downstream step, so you skip the NOK 2 181 registration fee. Just bring its
> details up to date via a **free endringsmelding** (Samordnet registermelding → "endre" in
> Altinn): update the næringskode to 62.010 if needed, and confirm no outstanding tax/MVA from
> prior activity. Verify it is still **aktiv** (not slettet/under avvikling) at brreg.no first.

> Liability note: an ENK gives **no liability shield** — the innehaver is personally liable. Since
> Talli submits statutory filings on behalf of customers and processes their financial data
> (see the DPA / ToS in `docs/legal/`), revisit the AS question before onboarding live customers.
> An ENK can be converted to an AS later, but the org number changes, which means re-doing
> Steps 2–4. Plan accordingly.

- [ ] **Innehaver**: a person with a Norwegian fødselsnummer / D-nummer (you). No share capital
      and no founding document required for an ENK.
- [ ] Submit **Samordnet registermelding** (Altinn form **BR-1010 / "Registrer ny verksemd"**) to
      register the ENK in **Enhetsregisteret**. Issues the **organisasjonsnummer** (ENK is usually
      faster than an AS — often days). **Fee (current Brønnøysund table): NOK 2 181 digital /
      2 746 paper** for an ENK in Enhetsregisteret — choose **Digitalt** for the lower fee.
      (For comparison: an AS is 6 825 digital; adding Foretaksregisteret later is 3 185.)
- [ ] **Foretaksregisteret is not required** for Talli. An ENK only needs Foretaksregisteret if
      it resells purchased goods, has >5 employees, operates as statsautorisert regnskapsfører/
      revisor, or takes pant i varelager — none apply to Talli (a software service, not an
      accountant/auditor firm). Verified: Buypass/Commfides issue a virksomhetssertifikat, and
      Maskinporten works, on the **Enhetsregisteret** org number alone. You *may* still opt in
      (it's a right, not a duty) for foretaksnavn protection + a firmaattest, for a one-time fee
      (tilleggsregistrering: NOK 3 185 digital).
- [ ] **Næringskode (NACE)**: pick the closest main activity — **62.010 Programmeringstjenester**
      ("Programvareutvikling") fits a filing-assistant SaaS. It only feeds SSB statistics, has
      **no effect** on the virksomhetssertifikat / Maskinporten / Altinn (those bind to the org
      number), and can be changed later for free. Alternatives if preferred: 63.110
      (databehandling/datalagring) or 58.290 (utgivelse av annen programvare). Don't overthink it.
- [ ] Confirm you hold the **Tilgangsstyrar (Access manager)** role on the new org in Altinn —
      required later to delegate access packages to the system user. Getting this now avoids a
      round-trip at Step 4.

### Step 2 — Client key / certificate

Maskinporten signs the client-assertion JWT with your key. The requirement **differs by
environment**, which matters for cost while doing action item 1 (test-env onboarding only):

- **Test environment (free):** Maskinporten's test/ver2 accepts a **self-generated key pair /
  self-signed certificate** — no CA purchase needed. Do the entire test integration this way and
  defer spend.
  - [ ] Generate a key pair locally, e.g. `openssl genrsa -out talli-test.key 4096` then
        `openssl req -new -x509 -key talli-test.key -out talli-test.pem -days 1095 -subj "/CN=Talli test"`.
  - [ ] Keep the private key secure; you upload only the **public** key/cert at Step 3 (test).
- **Production (paid, defer until cutover):** production Maskinporten requires a CA-issued
  **virksomhetssertifikat** from **Buypass** or **Commfides** for org 930835978 (~NOK 1 500–4 000/yr).
  - [ ] Buy it only when moving an obligation to production. Order the **soft/file-based** cert
        (server use), not a smartkort, and keep the key in production-separated storage.

### Step 3 — Maskinporten client (Samarbeidsportalen)

- [ ] **Test access:** go to **samarbeid.digdir.no**, log in with **ID-porten as the org's
      authorised person** (innehaver for an ENK) to start registration + accept Digdir's
      bruksvilkår. A brand-new org may get *"Din virksomhet er ikke registrert som bruker av
      denne tjenesten enda"* — if so, email **servicedesk@digdir.no** with org number, contact
      person, purpose, and a screenshot to be enrolled as a Maskinporten customer (a few business
      days). Self-registration by email requires the org's **registered email domain**, which is a
      snag for ENKs with only a personal email.
- [ ] Register a Maskinporten **integration (oauth2 client)** with: `integration_type=maskinporten`,
      `token_endpoint_auth_method=private_key_jwt`, `grant_types=jwt-bearer`, a clear `description`,
      and **upload your own public key/JWK** (the self-generated key from Step 2; `kid` must be
      globally unique). One client per scope is recommended. **As a supplier using Altinn
      delegation, create the integration as belonging to yourself — do NOT pick "på vegne av en
      kunde".** At token time pass the customer's org as the `consumer_org` claim; Maskinporten
      then checks Altinn for a valid delegation.
- [ ] Add the per-obligation scope (table below). Altinn-delegated scopes appear under **"Scopes
      tilgjengelig for alle"**; some scopes still require **API-owner grant** (Skatteetaten /
      Brønnøysund) before they activate. Record the auto-assigned **client_id**.
- [ ] Smoke-test signing against the **test** token endpoint (`https://test.maskinporten.no/token`,
      JWT `aud=https://test.maskinporten.no/`, `iss=client_id`, `exp − iat ≤ 120s`). A delegated
      call on behalf of a company additionally needs the `consumer_org` claim / systembruker from
      Step 4 and a Tenor subject from Step 5, so a full accepted submission comes after those.

### Step 4 — Altinn system user + access packages (systembruker + tilgangspakker)

- [ ] Register Talli's **system** in Altinn's system register with the required **access
      packages** (tilgangspakker — the 2025 granular replacement for the old Altinn roles).
- [ ] For each customer company (and for synthetic test subjects), the company's **Access
      manager** delegates the relevant access package(s) to the system user in Altinn.
      Suppliers cannot self-delegate; the company always approves.

### Step 5 — Synthetic test subjects (Tenor)

- [ ] Obtain **Tenor** synthetic test organisations/persons for the test environments. Never
      use real customer data in TT02 / Skatteetaten test env.

## Per-obligation scopes and test surfaces

| Obligation (label) | Issue | `obligation` value | Maskinporten scope(s) | Test surface |
|---|---|---|---|---|
| Aksjonærregisteroppgaven (RF-1086) | #81 | `aksjonaerregisteroppgaven` | `skatteetaten:innrapporteringaksjonaerregisteroppgave` | Skatteetaten test env; POST 1086H / 1086U / bekreft, GET dokumenter |
| Årsregnskap (RR-0002) | #84 | `aarsregnskap` | `altinn:instances.read`, `altinn:instances.write` | Regnskapsregisteret machine API via Altinn3 **TT02**; system user fills + locks, **ID-porten** signs (hybrid); `dataFormatId=1266` |
| Skattemelding for AS | #87 | `skattemelding` | `skatteetaten:skattemeldingupersonlig` (the documented scope for the AS/"upersonlig" tax return; + `altinn:instances.*`) | Skatteetaten external test env; system-supplier submission. ⚠️ Scope requires **Skatteetaten approval + DPA + legal basis** (confidential data) and the upersonlig API is **not adapted for system-user/end-user display** — confirm the supported owner-managed path with Skatteetaten first. Altinn3 app `skd/formueinntekt-skattemelding-v2`; 2025 schema `skattemeldingUpersonlig_v5` / `naeringsspesifikasjon_v6` |

Trace any payload fields to the maps/evidence registers in `docs/filing/` — do not invent fields.

**The access process differs per obligation** — they are not three identical scope clicks:
- **RF-1086** — a plain Maskinporten scope requested in Samarbeidsportalen (Altinn-delegated).
- **Årsregnskap** — **not** a Maskinporten scope: set up an **Altinn systembruker** (Profil →
  Avanserte innstillinger → Programmer og systembrukere) in **TT02** and attach the
  **Regnskapsregisteret – innsending av årsregnskap** access package; signing needs **ID-porten**.
- **Skattemelding** — Skatteetaten grants `skatteetaten:skattemeldingupersonlig` explicitly:
  register as **systemleverandør**, sign a **databehandleravtale**, document a **legal basis**,
  then request the scope/rettighetspakke. Start this first — it is the slowest-lead gate.

> RF-1086 live scope is intentionally narrow: only `stiftelse` / no-activity (event code `N`).
> K/S/U (kjøp/salg/utbytte) stay excluded (`RF1086_EVENT_UNSUPPORTED`) until Skatteetaten
> code-list evidence or test-env acceptance is recorded.

## Run the test submissions (per obligation)

For each obligation, once Steps 1–5 are done and the scope is active:

1. [ ] Authenticate via Maskinporten (test env) using the virksomhetssertifikat.
2. [ ] Submit a synthetic-subject filing through the obligation's test surface (table above).
3. [ ] Confirm the authority returns an **accepted** status, a **receipt reference**, and an
       **archive reference**. Capture all three — they are required evidence.

## How this maps to Talli's gates

`buildFilingReleaseGates` (`app/lib/filing-release-gate.ts`) fail-closes each obligation to
`production_disabled` until **all** of the following exist for that obligation. Record them in
this order:

1. **`authority_permissions`** — owner confirms innsendingsrett for the obligation
   (`productionAuthorityGate`, `app/lib/authority-permission.ts`). `production_enabled` stays
   false until the rest below pass.
2. **`authority_test_runs`** — an **accepted** test run with `receipt_reference` +
   `archive_reference` (`buildAuthorityTestRun` / `authorityTestEvidenceGate`,
   `app/lib/authority-test-evidence.ts`). This is what Step "Run the test submissions" produces.
3. **`launch_signoffs`** — the obligation's signoff key approved (`buildLaunchSignoffRecord`,
   `app/lib/launch-signoff.ts`), recorded via admin-only `recordLaunchSignoff` (`app/actions.ts`):
   - RF-1086 → `rf1086_authority`
   - Årsregnskap → `annual_accounts_authority`
   - Skattemelding → `tax_return_authority`
4. Plus the shared gates already tracked elsewhere: billing, step-up auth, and security/restore.

Only when an obligation's permission, accepted test run, and approved signoff all pass can
`production_enabled` be flipped for that obligation. These records require live Supabase
credentials and the admin/step-up flow, so they are performed in the running app, not from CLI.

## Progress tracker

| Step | RF-1086 (#81) | Årsregnskap (#84) | Skattemelding (#87) |
|---|---|---|---|
| 1. Operating entity registered (ENK, org nr) | ☐ | ☐ | ☐ |
| 2. Virksomhetssertifikat | ☐ | ☐ | ☐ |
| 3. Maskinporten client + scope | ☐ | ☐ | ☐ |
| 4. Altinn system user + access pkg | ☐ | ☐ | ☐ |
| 5. Tenor test subjects | ☐ | ☐ | ☐ |
| 6. Accepted test submission | ☐ | ☐ | ☐ |
| 7. `authority_permissions` recorded | ☐ | ☐ | ☐ |
| 8. `authority_test_runs` accepted | ☐ | ☐ | ☐ |
| 9. `*_authority` launch signoff | ☐ | ☐ | ☐ |

Steps 1–5 are shared and only need to be done once; the per-obligation columns diverge from
Step 3 (scopes) onward.
