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
    actions: "Handlinger",
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

  onboarding: {
    title: "Kom i gang",
    intro:
      "Vi setter opp holdingselskapet ditt for årsoppgjøret — steg for steg.",
    steps: {
      company: "Selskap",
      balances: "Åpningsbalanse",
      bank: "Bank (valgfritt)",
    },
    lookup: {
      title: "Finn selskapet ditt",
      intro: "Vi henter selskapsdetaljene fra Brønnøysundregistrene.",
      orgLabel: "Organisasjonsnummer",
      orgHelp: "9 sifre. Vi henter navn og adresse automatisk.",
      orgInvalid: "Organisasjonsnummer må ha 9 sifre.",
      boundaryTitle: "Kun for enkle holding-AS",
      boundaryBody:
        "Talli støtter aksjeselskap (AS). Andre selskapsformer som ENK, NUF og ASA, eller selskaper som trenger regnskapsfører, stoppes her.",
      cta: "Hent fra Brønnøysund",
      pending: "Henter …",
    },
    balances: {
      title: "Åpningsbalanse",
      intro: "Registrer aksjekapital, aksjonærer og bankinnskudd ved oppstart.",
      yearLabel: "Regnskapsår",
      bankLabel: "Bankinnskudd (kr)",
      shareCapitalLabel: "Aksjekapital (kr)",
      shareCountLabel: "Antall aksjer",
      nominalLabel: "Pålydende per aksje (kr)",
      shareholdersTitle: "Aksjonærer",
      addShareholder: "Legg til aksjonær",
      removeShareholder: "Fjern",
      nameLabel: "Navn",
      kindLabel: "Type",
      kindPerson: "Person",
      kindCompany: "Selskap",
      nationalIdLabel: "Fødselsnummer (11 sifre)",
      orgNumberLabel: "Organisasjonsnummer (9 sifre)",
      sharesLabel: "Aksjer",
      reconcileTitle: "Avstemming",
      checkCapital: "Aksjekapital = antall aksjer × pålydende",
      checkShares: "Sum aksjer per aksjonær = antall aksjer",
      checkShareholders: "Hver aksjonær har gyldig navn og ID",
      ok: "Stemmer",
      mismatch: "Avvik",
      blockedHint: "Rett opp avvikene før du kan fortsette.",
      cta: "Lagre og fortsett",
      pending: "Lagrer …",
    },
    bank: {
      title: "Importer banktransaksjoner",
      intro:
        "Valgfritt: lim inn bankutskrift (CSV) for året, så avstemmer vi senere. Du kan hoppe over og gjøre dette når som helst.",
      csvLabel: "Bank CSV",
      csvHelp: "Lim inn rader fra nettbanken: dato, tekst, beløp, saldo.",
      importedTitle: "Importert",
      importedBody: (count: number) =>
        `${count} banktransaksjoner er registrert.`,
      cta: "Importer",
      pending: "Importerer …",
      finish: "Fullfør og gå til oversikt",
      skip: "Hopp over",
    },
  },

  actions: {
    hubTitle: "Holdinghandlinger",
    hubIntro:
      "Registrer kjøp og salg av aksjer, utbytte, lån og skatt — steg for steg, med forhåndsvisning av bokføringen før du bekrefter.",
    needsCompanyTitle: "Sett opp selskapet først",
    needsCompanyBody:
      "Du må sette opp holdingselskapet før du kan registrere handlinger.",
    needsCompanyCta: "Kom i gang",
    chooseTitle: "Hva vil du registrere?",
    recentTitle: "Nylig bokført",
    recentEmpty: "Ingen handlinger er bokført ennå.",
    posted: "Handlingen er bokført. Du finner den i listen under.",
    backToHub: "Tilbake til handlinger",

    previewTitle: "Forhåndsvisning av bokføring",
    previewIntro: "Dette posteres når du bekrefter:",
    blockTitle: "Dette må en regnskapsfører se på",
    confirmCta: "Bekreft og bokfør",
    pending: "Bokfører …",
    fillToPreview: "Fyll ut feltene over for å se bokføringen.",
    debit: "Debet",
    credit: "Kreditt",
    account: "Konto",
    dateHelp: "Format: ÅÅÅÅ-MM-DD",
    yearLabel: "Inntektsår",
    doc: {
      label: "Dokumentasjon",
      attached: "Bilag vedlagt",
      missing: "Mangler bilag (akseptert)",
      notRequired: "Ikke påkrevd",
    },
    taxTreatment: {
      label: "Skattemessig behandling",
      fritak: "Fritaksmetoden (vanlig for holding-AS)",
      outside: "Utenfor fritaksmetoden",
      needsAccountant: "Usikker / annet",
    },
    investmentKind: {
      label: "Type investering",
      norwegianPrivate: "Norsk privat aksjeselskap (AS)",
      listed: "Børsnotert / annet verdipapir",
    },

    accountNames: {
      "1370": "Fordring på aksjonær",
      "1570": "Skatt til gode",
      "1800": "Aksjer og andeler",
      "1920": "Bankinnskudd",
      "2050": "Avsatt utbytte",
      "2255": "Gjeld til aksjonær",
      "2500": "Betalbar skatt",
      "8070": "Finansinntekt (utbytte/gevinst)",
      "8090": "Finanskostnad (tap)",
      "8300": "Skattekostnad",
    } as Record<string, string>,

    typeLabels: {
      share_purchase: "Kjøp aksjer",
      share_sale: "Selg aksjer",
      dividend_received: "Mottatt utbytte",
      dividend_to_owner: "Utbytte til deg",
      shareholder_loan: "Aksjonærlån",
      tax_settlement: "Skatteoppgjør",
    } as Record<string, string>,

    cards: {
      "share-purchase": {
        title: "Kjøp aksjer",
        body: "Registrer kjøp av aksjer i et norsk AS.",
      },
      "share-sale": {
        title: "Selg aksjer",
        body: "Selg fra en eksisterende posisjon, med gevinst eller tap.",
      },
      "dividend-received": {
        title: "Mottatt utbytte",
        body: "Utbytte selskapet har mottatt på sine investeringer.",
      },
      "owner-dividend": {
        title: "Utbytte til deg",
        body: "Del ut utbytte til aksjonær, med selskapsdokumenter.",
      },
      "shareholder-loan": {
        title: "Aksjonærlån",
        body: "Lån mellom selskapet og en aksjonær.",
      },
      "tax-settlement": {
        title: "Skatteoppgjør",
        body: "Betalbar skatt, betaling eller refusjon.",
      },
    } as Record<string, { title: string; body: string }>,

    sharePurchase: {
      title: "Kjøp aksjer",
      intro:
        "Registrer kjøp av aksjer i et norsk aksjeselskap under fritaksmetoden.",
      nameLabel: "Selskapet du kjøper i",
      keyLabel: "Investerings-ID",
      keyHelp: "En kort, fast referanse — f.eks. selskapets kortnavn.",
      orgLabel: "Organisasjonsnummer",
      dateLabel: "Kjøpsdato",
      sharesLabel: "Antall aksjer",
      amountLabel: "Kjøpsbeløp (kr)",
    },
    shareSale: {
      title: "Selg aksjer",
      intro: "Selg fra en eksisterende investeringsposisjon.",
      positionLabel: "Posisjon",
      positionPlaceholder: "Velg posisjon",
      noPositions:
        "Du har ingen investeringsposisjoner å selge fra ennå. Registrer et aksjekjøp først.",
      dateLabel: "Salgsdato",
      sharesLabel: "Antall solgte aksjer",
      proceedsLabel: "Salgsproveny (kr)",
      gainLabel: "Beregnet gevinst",
      lossLabel: "Beregnet tap",
      remainingLabel: "Gjenstående aksjer",
      ofShares: (count: number) => `${count} aksjer tilgjengelig`,
    },
    dividendReceived: {
      title: "Mottatt utbytte",
      intro: "Registrer utbytte selskapet har mottatt på en investering.",
      payerLabel: "Utbetalende selskap",
      investmentLabel: "Investering",
      investmentPlaceholder: "Velg investering",
      noInvestments:
        "Du har ingen investeringer ennå. Registrer et aksjekjøp først.",
      declaredLabel: "Vedtaksdato",
      paidLabel: "Utbetalingsdato",
      amountLabel: "Brutto utbytte (kr)",
      addBackNote: (amount: number) =>
        `3 % av utbyttet (${amount} kr) legges til som skattepliktig inntekt under fritaksmetoden.`,
    },
    ownerDividend: {
      title: "Utbytte til deg",
      intro:
        "Del ut utbytte til en aksjonær. Talli oppretter styreforslag og protokoll som arkivklare dokumenter.",
      shareholderLabel: "Aksjonær",
      shareholderPlaceholder: "Velg aksjonær",
      noShareholders:
        "Du har ingen registrerte aksjonærer ennå. Fullfør oppsettet først.",
      decisionLabel: "Beslutningsdato",
      paymentLabel: "Betalingsdato",
      amountLabel: "Utbyttebeløp (kr)",
      equityLabel: "Fri egenkapital (kr)",
      equityHelp: "Utbyttet kan ikke overstige fri egenkapital.",
      liquidityLabel: "Likviditet etter utbetaling (kr)",
      liquidityHelp: "Må være null eller positiv.",
    },
    shareholderLoan: {
      title: "Aksjonærlån",
      intro: "Registrer lån mellom selskapet og en aksjonær.",
      directionLabel: "Retning",
      dirToCompany: "Aksjonær låner til selskapet",
      dirToCorporate: "Selskapet låner til selskapsaksjonær",
      dirToPersonal: "Selskapet låner til personlig aksjonær",
      personalBlock:
        "Lån fra selskap til personlig aksjonær må håndteres av regnskapsfører.",
      securityBlock:
        "Sikkerhet eller garanti mellom nærstående må vurderes av regnskapsfører.",
      dateLabel: "Lånedato",
      amountLabel: "Lånebeløp (kr)",
      counterpartyLabel: "Motpart",
      securityLabel: "Sikkerhet eller garanti mellom nærstående",
      interestLabel: "Rente er beregnet",
    },
    taxSettlement: {
      title: "Skatteoppgjør",
      intro: "Registrer betalbar skatt, betaling eller refusjon.",
      typeLabel: "Type",
      typePayable: "Betalbar skatt (avsetning)",
      typePayment: "Betaling av skatt",
      typeRefund: "Skatterefusjon",
      dateLabel: "Oppgjørsdato",
      amountLabel: "Beløp (kr)",
    },
  },
} as const;

export type OwnerCopy = typeof ownerCopy;
