import { Exam, RegistrationFlow, RegistrationKind } from '../types';

/**
 * What a user actually has to do *after* tapping "Anmäl dig".
 *
 * Every listing links out to somebody else's system, and those systems are not
 * alike: some drop you straight on a booking form, some need BankID first, some
 * are a webshop, and a few are still a PDF you print and post. Showing the
 * remaining steps up front is the difference between "a link" and "a booking
 * you can finish in three minutes", so the flow is part of the listing data,
 * not decoration.
 *
 * Flows are derived from the registration URL rather than repeated on all ~90
 * listings: the URL is the thing that's verified against the provider's site,
 * so deriving keeps the two from drifting apart. A listing can still override
 * via `Exam.registration` when a provider does something unusual.
 */

const FLOWS: Record<RegistrationKind, Omit<RegistrationFlow, 'kind'>> = {
  form: {
    ctaLabel: 'Anmäl dig',
    landing: 'Länken går direkt till anmälningsformuläret.',
    steps: [
      'Fyll i dina uppgifter i formuläret',
      'Välj kurs och prövningsperiod',
      'Skicka in – bekräftelsen kommer via e-post',
    ],
    direct: true,
  },
  coursepicker: {
    ctaLabel: 'Välj kurs och anmäl dig',
    landing: 'Länken går direkt till kurslistan för prövningar.',
    steps: [
      'Välj ämnesområde och din kurs i listan',
      'Logga in med BankID',
      'Bekräfta anmälan och betala avgiften',
    ],
    direct: true,
  },
  eservice: {
    ctaLabel: 'Öppna e-tjänsten',
    landing: 'Länken går direkt till kommunens e-tjänst för prövningsanmälan.',
    steps: [
      'Logga in med BankID',
      'Fyll i kurs, kurskod och personuppgifter',
      'Skicka in och betala avgiften enligt instruktionerna',
    ],
    direct: true,
  },
  webshop: {
    ctaLabel: 'Boka din plats',
    landing: 'Länken går direkt till bokningen – platsen betalas i kassan.',
    steps: [
      'Lägg prövningen i varukorgen',
      'Fyll i dina uppgifter och vilken kurs det gäller',
      'Betala – platsen är bokad direkt',
    ],
    direct: true,
  },
  pdf: {
    ctaLabel: 'Hämta anmälningsblanketten',
    landing: 'Länken öppnar skolans anmälningsblankett som PDF.',
    steps: [
      'Ladda ner och fyll i blanketten',
      'Skriv under den',
      'Skicka in den till skolan enligt instruktionerna i blanketten',
    ],
    direct: false,
  },
  email: {
    ctaLabel: 'Läs hur du anmäler dig',
    landing: 'Anmälan görs via e-post till skolan — adressen står på sidan.',
    steps: [
      'Betala avgiften enligt sidans betalningsuppgifter',
      'Mejla skolan med personnummer, kontaktuppgifter och vilken kurs det gäller',
      'Bifoga kvitto på betalningen (eller betygskopia om prövningen är avgiftsfri)',
    ],
    direct: false,
  },
  inperson: {
    ctaLabel: 'Läs vad du tar med dig',
    landing: 'Anmälan görs på plats hos anordnaren — länken går till sidan med tider och adress.',
    steps: [
      'Läs sidan: öppettider, adress och vad som ska med',
      'Ta med legitimation och vidimerad betygskopia',
      'Besök receptionen under anmälningsperioden och betala avgiften på plats',
    ],
    direct: false,
  },
  page: {
    ctaLabel: 'Gå till anmälan',
    landing: 'Länken går till skolans prövningssida, där anmälan görs.',
    steps: [
      'Leta upp anmälningslänken eller blanketten på sidan',
      'Fyll i anmälan för din kurs',
      'Betala avgiften enligt skolans instruktioner',
    ],
    direct: false,
  },
};

/** First match wins. Ordered most specific → most general. */
const RULES: Array<{ kind: RegistrationKind; match: (url: URL) => boolean }> = [
  // Standalone form builders — always land straight on the form itself.
  {
    kind: 'form',
    match: (u) => /(^|\.)(typeform\.com|office\.com|forms\.gle|google\.com)$/.test(u.hostname),
  },
  { kind: 'form', match: (u) => u.hostname === 'ansokan-provning.nti.se' },
  { kind: 'pdf', match: (u) => u.pathname.toLowerCase().endsWith('.pdf') },
  // Document endpoints that serve a PDF without saying so in the path. Gotland's
  // document service is the one in the dataset (verified: application/pdf), and
  // a blankett behind an opaque URL is still a blankett — promising the user a
  // web form there would be wrong.
  { kind: 'pdf', match: (u) => u.hostname.startsWith('dokument.') },
  // IST Open24 — the application portal several kommuner run their vuxenutbildning
  // on. You land on its login, which is the e-service itself, not a page about one.
  { kind: 'eservice', match: (u) => u.hostname === 'open24.ist-asp.com' },
  // Webshops — Iris and MedLearn sell prövningsplatser like any other product.
  { kind: 'webshop', match: (u) => u.hostname.startsWith('shop.') },
  // Alvis: the /provning/amnesomrade and /hittakurser entry points are course
  // pickers; anything else on Alvis (e.g. /login) is a plain e-service.
  {
    kind: 'coursepicker',
    match: (u) => u.hostname.endsWith('.alvis.se') && /provning|hittakurser/.test(u.pathname),
  },
  { kind: 'coursepicker', match: (u) => u.hostname === 'education.service.tieto.com' },
  { kind: 'eservice', match: (u) => u.hostname.endsWith('.alvis.se') },
  // Municipal self-service portals. These all sit on their own subdomain,
  // which is what separates them from the ordinary kommun website.
  {
    kind: 'eservice',
    match: (u) =>
      /^(sjalvservice|sjalvbetjaning|minasidor|e-tjanst|e-tjanster|etjanst|etjanster|eservice|service|e|ansokanvux|barnskolautbildning|webb)\./.test(
        u.hostname,
      ) ||
      u.hostname.endsWith('.enamnd.se') ||
      u.hostname.startsWith('centrumvux.'),
  },
];

export function getRegistrationFlow(exam: Exam): RegistrationFlow {
  if (exam.registration) {
    return { ...FLOWS[exam.registration.kind], ...exam.registration };
  }
  let kind: RegistrationKind = 'page';
  try {
    const url = new URL(exam.registrationUrl);
    kind = RULES.find((r) => r.match(url))?.kind ?? 'page';
  } catch {
    // Malformed URL in the dataset — fall back to the conservative flow rather
    // than promising the user a one-click booking that isn't there.
  }
  return { kind, ...FLOWS[kind] };
}
