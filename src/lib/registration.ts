import { RegistrationKind } from '../types';

/**
 * Classify a registration URL by how close it gets the user to an actual
 * booking. Derived from the URL rather than stored per listing so that the
 * label can never drift out of sync with the link it describes — fix the URL
 * and the promise about it updates with it.
 */
export function classifyRegistrationUrl(url: string): RegistrationKind {
  let host: string;
  let path: string;
  try {
    const u = new URL(url);
    host = u.hostname.toLowerCase();
    path = u.pathname.toLowerCase();
  } catch {
    return 'info';
  }

  if (path.endsWith('.pdf')) return 'blankett';

  // Alvis is the dominant komvux admissions system. /provning/amnesomrade is
  // step 1 of 3 in its booking flow; /hittakurser is its course picker.
  if (host.endsWith('.alvis.se') && (path.startsWith('/provning') || path.startsWith('/hittakurser'))) {
    return 'booking';
  }

  // Private providers sell the prövning as a product — the link is the checkout.
  if (host.startsWith('shop.') || path.includes('/produkt/')) return 'booking';

  // Purpose-built booking forms outside the big platforms.
  if (host === 'ansokan-provning.nti.se') return 'booking';
  if (path.includes('/ansok/provning')) return 'booking';

  // Municipal e-services: a real form, but behind an e-legitimation login.
  const ETJANST_HOST_PREFIXES = ['sjalvservice.', 'e-tjanster.', 'etjanster.', 'minasidor.', 'ansokanvux.', 'barnskolautbildning.'];
  if (ETJANST_HOST_PREFIXES.some(p => host.startsWith(p))) return 'etjanst';
  if (host.endsWith('.enamnd.se') || host === 'e.umea.se') return 'etjanst';
  if (path.includes('/e-tjanster-och-blanketter/')) return 'etjanst';
  if (path.includes('/oversikt/overview/')) return 'etjanst';

  return 'info';
}

interface KindMeta {
  /** Verb for the primary button. */
  cta: string;
  /** Short badge text. */
  badge: string;
  /** One line under the button telling the user what to expect. */
  note: string;
}

export const REGISTRATION_KIND_META: Record<RegistrationKind, KindMeta> = {
  booking: {
    cta: 'Anmäl dig hos',
    badge: 'Direkt till anmälan',
    note: 'Länken öppnar anmälningsformuläret — du är några steg från att vara anmäld.',
  },
  etjanst: {
    cta: 'Anmäl dig hos',
    badge: 'E-tjänst · BankID',
    note: 'Länken öppnar kommunens e-tjänst. Du loggar in med BankID och fyller i anmälan där.',
  },
  blankett: {
    cta: 'Hämta blanketten hos',
    badge: 'Blankett (PDF)',
    note: 'Länken öppnar en PDF-blankett som du fyller i och skickar till skolan.',
  },
  info: {
    cta: 'Till anmälan hos',
    badge: 'Skolans sida',
    note: 'Skolan har ingen öppen bokningslänk — länken går till deras prövningssida där anmälan startar.',
  },
};
