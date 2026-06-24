import {
  preProductionDirectFilingCopy,
  requiredNonAffiliationCopy,
} from "./launch-copy";

/**
 * Central owner-facing copy — Norwegian first.
 *
 * Every string an owner can read should live here, not inline in components, so
 * the language stays consistent and free of developer/infrastructure jargon.
 * Operator-only surfaces (the (operator) route group) and code/comments may stay
 * in English. See docs/design/copy.md for the terminology guide.
 */
export const ownerCopy = {
  brand: "Talli",
  tagline: "Holding-først årsrapportering for enkle AS.",

  nav: {
    overview: "Oversikt",
    workspace: "Arbeidsflate",
    operator: "Operatør",
    signOut: "Logg ut",
  },

  auth: {
    signInTitle: "Logg inn",
    signInIntro: "Holding-først årsrapportering for enkle AS.",
    signInCta: "Logg inn",
    signInPending: "Logger inn …",
    signUpTitle: "Opprett bruker",
    signUpIntro: "Kom i gang med holdingselskapets årsoppgjør.",
    signUpCta: "Opprett bruker",
    signUpPending: "Oppretter …",
    emailLabel: "E-post",
    passwordLabel: "Passord",
    passwordHelp: "Minst 6 tegn.",
    haveAccount: "Har du allerede konto?",
    noAccount: "Ny her?",
    toSignIn: "Logg inn",
    toSignUp: "Opprett bruker",
    unavailableTitle: "Tjenesten er ikke klar",
    unavailable: "Innlogging er midlertidig utilgjengelig. Prøv igjen om litt.",
  },

  obligations: {
    aksjonaerregisteroppgaven: "Aksjonærregisteroppgaven",
    skattemelding: "Skattemelding for AS",
    aarsregnskap: "Årsregnskap",
  },

  status: {
    ready: "Klar",
    notAssessed: "Ikke vurdert",
    blocked: "Blokkert",
    review: "Trenger gjennomgang",
    filed: "Levert",
    draft: "Utkast",
  },

  dashboard: {
    welcomeTitle: "Velkommen til Talli",
    orgLine: (org: string, year: number) =>
      `Org.nr ${org} · Inntektsår ${year}`,
    complianceTitle: (year: number) => `Årsoppgjør ${year}`,
    overviewTitle: "Oversikt",
    deadlinesTitle: "Frister",
    nextStepEyebrow: "Neste steg",
    metrics: {
      documents: "Dokumenter",
      transactions: "Transaksjoner",
      unmatched: "Uavstemte",
      actions: "Holdinghandlinger",
    },
    empty: {
      title: "Sett opp holdingselskapet ditt",
      body: "Hent selskapet fra Brønnøysund, så ordner vi årsoppgjøret sammen — det tar under ett minutt.",
      cta: "Kom i gang",
    },
    nextAction: {
      setupEyebrow: "Kom i gang",
      setupTitle: "Sett opp holdingselskapet ditt",
      setupBody:
        "Hent selskapet fra Brønnøysund og fullfør oppsettet på under ett minutt.",
      setupCta: "Kom i gang",
      pendingEyebrow: (year: number) => `Årsoppgjør ${year}`,
      pendingTitle: "Gjør klar årsoppgjøret",
      pendingBody: (remaining: number, total: number) =>
        `${remaining} av ${total} plikter gjenstår før du kan sende inn.`,
      pendingCta: "Fortsett",
      reconcileEyebrow: "Avstemming",
      reconcileTitle: "Avstem banktransaksjoner",
      reconcileBody: (count: number) =>
        `${count} transaksjoner mangler kobling mot regnskapet.`,
      reconcileCta: "Avstem nå",
      readyEyebrow: "Status",
      readyTitle: "Alt ser klart ut",
      readyBody:
        "Forhåndsvis og send inn når du er klar. Talli holder deg i forhåndsvisning til alt er trygt.",
      readyCta: "Se innsending",
    },
    blockersLabel: "Dette gjenstår:",
    openFilingCta: "Åpne",
  },

  filing: {
    title: "Innsending",
    previewLabel: "Forhåndsvisning",
    notAffiliated: requiredNonAffiliationCopy,
    preProductionGate: preProductionDirectFilingCopy,
  },

  workspace: {
    boundaryEyebrow: "Innsending",
    boundaryTitle: "Holding-først årsrapportering for enkle AS.",
    authorities: "Myndigheter",
    authoritiesValue: "Ikke tilknyttet",
    directFiling: "Direkte innsending",
    directFilingValue: "Åpnes senere",

    introEyebrow: "Arbeidsflate",
    introTitle: "Holdingselskapet ditt",
    introLede:
      "Alle verktøyene for holdingselskapets årsoppgjør samlet på ett sted.",

    statusHeading: "Status",
    signedIn: "Innlogget",
    signedOut: "Ikke innlogget",
    companiesLabel: "Selskaper",
    connectionLabel: "Tilkobling",
    connectionOk: "OK",
    connectionError: "Feil",

    createEyebrow: "Nytt selskap",
    createTitle: "Hent selskapet fra Brønnøysund.",
    createCta: "Hent fra Brønnøysund og opprett",
    onlyAs: "Kun AS går videre. ENK, NUF, ASA og andre selskapsformer stoppes før selskapet opprettes.",

    companiesEyebrow: "Dine selskaper",
    companiesTitle: "Selskapene dine.",
    noCompaniesLabel: "Ingen selskap",
    noCompaniesStatus: "Utkast",
    noCompaniesBody: "Opprett ditt første selskap for å komme i gang.",

    security: {
      eyebrow: "Sikkerhet",
      title: "Sensitive handlinger krever ekstra bekreftelse.",
      body: "Innsending, innsendingsrett, invitasjon av gjennomgåer, rolleendring, arkiveksport, faktureringsendring og sletting krever at du bekrefter identiteten din på nytt. Både tillatte og blokkerte forsøk lagres i loggen – uten sensitive detaljer.",
      points: [
        "Sikker pålogging",
        "Eierrolle i selskapet",
        "Hvert selskaps data er adskilt fra andres",
        "Ny identitetsbekreftelse innen 15 minutter for sensitive handlinger",
        "Logg av både tillatte og blokkerte forsøk",
      ],
    },
  },
} as const;

export type OwnerCopy = typeof ownerCopy;
