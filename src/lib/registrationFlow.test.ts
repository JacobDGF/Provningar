import { describe, it, expect } from 'vitest';
import { getRegistrationFlow } from './registrationFlow';
import { Exam, RegistrationKind } from '../types';

function examWith(registrationUrl: string, registration?: Exam['registration']): Exam {
  return { registrationUrl, registration } as Exam;
}

const CASES: Array<[string, RegistrationKind]> = [
  ['https://form.typeform.com/to/Nitj2W7p', 'form'],
  ['https://ansokan-provning.nti.se/', 'form'],
  [
    'https://vuxenutbildningen.karlshamn.se/wp-content/uploads/2026/04/anmalan_till_provning.pdf',
    'pdf',
  ],
  ['https://shop.iris.se/produkt/provning-for-betyg-i-flemingsberg/', 'webshop'],
  ['https://huddinge.alvis.se/provning/amnesomrade', 'coursepicker'],
  ['https://provningsenheten.alvis.se/hittakurser', 'coursepicker'],
  [
    'https://education.service.tieto.com/AdultApplication.Student/#/search-offering/kv?domain=molndaledu',
    'coursepicker',
  ],
  ['https://norrkoping.alvis.se/login', 'eservice'],
  // Verified as application/pdf despite the URL saying nothing about it.
  ['https://dokument.gotland.se/IntegrationService.svc/doc/content/47915', 'pdf'],
  ['https://open24.ist-asp.com/kunskapsnavet/vux/Vux/Login?ref=Application%2FOverview', 'eservice'],
  ['https://sjalvservice.malmo.se/oversikt/overview/926', 'eservice'],
  ['https://boden.enamnd.se/oversikt/overview/3858', 'eservice'],
  ['https://etjanst.motala.se/provning', 'eservice'],
  // Falkenberg's platform answers on `service.`, not `e-tjanst.` — same portal,
  // different prefix, and without the rule it read as a page about the booking.
  ['https://service.falkenberg.se/provning-ovriga-kurser', 'eservice'],
  ['https://www.uppsala.se/skola-forskola-och-komvux/komvux/studera-pa-komvux/provning/', 'page'],
];

describe('getRegistrationFlow', () => {
  it.each(CASES)('classifies %s as %s', (url, kind) => {
    expect(getRegistrationFlow(examWith(url)).kind).toBe(kind);
  });

  it('only calls a flow direct when the link lands on the booking itself', () => {
    expect(getRegistrationFlow(examWith('https://shop.iris.se/produkt/x/')).direct).toBe(true);
    expect(
      getRegistrationFlow(examWith('https://example.se/vuxenutbildning/provning/')).direct,
    ).toBe(false);
  });

  it('lets a listing override the derived flow', () => {
    const flow = getRegistrationFlow(
      examWith('https://karlskoga.se/vuxenutbildning/provning.html', { kind: 'email' }),
    );
    expect(flow.kind).toBe('email');
    expect(flow.steps.join(' ')).toMatch(/[Mm]ejla/);
  });

  it('never promises a click-through when the anmälan happens over a counter', () => {
    // Nässjö takes the anmälan in a reception, three afternoons a week. The
    // URL looks like any other kommun page, so only the override knows — and
    // the one thing the user needs before leaving is the opening hours, not a
    // "gå till anmälan" that ends on a page with no form on it.
    const flow = getRegistrationFlow(
      examWith('https://nassjo.se/barn-och-utbildning/vuxenutbildning/provning.html', {
        kind: 'inperson',
      }),
    );
    expect(flow.direct).toBe(false);
    expect(flow.ctaLabel).not.toMatch(/anmäl dig|boka/i);
    expect(flow.landing).toMatch(/på plats/i);
  });

  it('falls back to the cautious flow on a malformed URL', () => {
    const flow = getRegistrationFlow(examWith('not a url'));
    expect(flow.kind).toBe('page');
    expect(flow.direct).toBe(false);
  });
});
