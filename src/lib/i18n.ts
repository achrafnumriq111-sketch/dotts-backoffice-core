// Centralised translations. Add new locales by extending this map.
// Currency: EUR. Dates: DD-MM-YYYY. Timezone: Europe/Amsterdam.

export type Locale = "nl-NL" | "en-US";

export const DEFAULT_LOCALE: Locale = "nl-NL";

const nl = {
  common: {
    appName: "dotts",
    save: "Opslaan",
    cancel: "Annuleren",
    edit: "Bewerken",
    delete: "Verwijderen",
    add: "Toevoegen",
    search: "Zoeken",
    actions: "Acties",
    status: "Status",
    download: "Download",
    loading: "Laden…",
    noData: "Geen gegevens",
    yes: "Ja",
    no: "Nee",
  },
  topbar: {
    myAccount: "Mijn account",
    signOut: "Afmelden",
  },
  nav: {
    dashboard: "Dashboard",
    register: "Kassa",
    products: "Producten",
    sales: "Verkopen",
    closing: "Kasafsluiting",
    locations: "Locaties",
    team: "Team",
    settings: "Instellingen",
    subscription: "Abonnement",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Een overzicht van je activiteit vandaag.",
    revenueToday: "Omzet vandaag",
    transactions: "Transacties",
    avgTicket: "Gem. bonbedrag",
    activeStaff: "Actieve medewerkers",
    recentSales: "Recente verkopen",
    recentSalesEmpty: "Nog geen verkopen vandaag.",
  },
  register: {
    title: "Kassa",
    subtitle: "Voeg producten toe aan de bon en reken af.",
    currentOrder: "Huidige bestelling",
    emptyCart: "Nog geen producten toegevoegd.",
    subtotal: "Subtotaal",
    tax: "BTW",
    total: "Totaal",
    pay: "Afrekenen",
    categories: "Categorieën",
    allCategories: "Alle",
  },
  products: {
    title: "Producten",
    subtitle: "Beheer je productcatalogus.",
    newProduct: "Nieuw product",
    name: "Naam",
    category: "Categorie",
    price: "Prijs",
    vat: "BTW",
    stock: "Voorraad",
    drawerTitle: "Nieuw product",
    drawerSubtitle: "Vul de gegevens van het product in.",
  },
  sales: {
    title: "Verkopen",
    subtitle: "Geschiedenis van alle bonnen.",
    date: "Datum",
    receipt: "Bon #",
    amount: "Bedrag",
    method: "Betaalmethode",
    employee: "Medewerker",
    from: "Van",
    to: "Tot",
    filter: "Filter toepassen",
  },
  closing: {
    title: "Kasafsluiting",
    subtitle: "Sluit je kassa af aan het einde van de dag.",
    opening: "Openingssaldo",
    salesTotal: "Totaal verkopen",
    closing: "Eindsaldo",
    difference: "Verschil",
    notes: "Opmerkingen",
    submit: "Kassa afsluiten",
  },
  locations: {
    title: "Locaties",
    subtitle: "Beheer al je vestigingen onder één account.",
    newLocation: "Nieuwe locatie",
    primary: "Hoofdlocatie",
  },
  team: {
    title: "Team",
    subtitle: "Beheer medewerkers en rollen.",
    invite: "Medewerker uitnodigen",
    roles: {
      owner: "Eigenaar",
      manager: "Manager",
      employee: "Medewerker",
    },
  },
  settings: {
    title: "Instellingen",
    subtitle: "Configureer je organisatie.",
    tabs: {
      general: "Algemeen",
      tax: "Belasting",
      printer: "Bonprinter",
      integrations: "Integraties",
    },
    company: "Bedrijfsnaam",
    vat: "BTW-nummer",
    address: "Adres",
    vatRates: "BTW-tarieven",
    printerName: "Printernaam",
    printerIp: "IP-adres",
    integrationsEmpty: "Nog geen integraties geconfigureerd.",
  },
  subscription: {
    title: "Abonnement",
    subtitle: "Beheer je abonnement en facturen.",
    currentPlan: "Huidig abonnement",
    plan: "Plan",
    price: "Prijs",
    cycle: "Cyclus",
    nextBilling: "Volgende factuur",
    contractEnd: "Einde contract",
    setupFee: "Eenmalige setup-fee",
    amount: "Bedrag",
    invoices: "Facturen",
    description: "Omschrijving",
    paid: "Betaald",
    open: "Openstaand",
    overdue: "Achterstallig",
    monthly: "Maandelijks",
    annually: "Jaarlijks",
    toggleBlocked: "Mock: account geblokkeerd tonen",
  },
  notifications: {
    accountBlocked: "Account geblokkeerd — betaling vereist",
    accountBlockedDesc: "Voltooi de betaling om weer toegang te krijgen tot de kassa.",
    contactSupport: "Contact opnemen",
  },
  notFound: {
    title: "Pagina niet gevonden",
    subtitle: "De pagina die je zocht bestaat niet.",
    back: "Terug naar dashboard",
  },
};

const en: typeof nl = nl; // English copy can be added later.

const dictionaries: Record<Locale, typeof nl> = {
  "nl-NL": nl,
  "en-US": en,
};

export function t(): typeof nl {
  return dictionaries[DEFAULT_LOCALE];
}

export function formatCurrency(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(date: Date | string, locale: Locale = DEFAULT_LOCALE): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale = DEFAULT_LOCALE): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(d);
}
