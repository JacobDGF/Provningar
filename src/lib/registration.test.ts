import { describe, expect, it } from 'vitest';
import { classifyRegistrationUrl, REGISTRATION_KIND_META } from './registration';
import { EXAMS } from '../data/exams';

describe('classifyRegistrationUrl', () => {
  it('treats an Alvis prövning flow as a booking form', () => {
    // Step 1 of 3 in Alvis' own booking wizard — the case the whole feature
    // exists to distinguish from a municipal landing page.
    expect(classifyRegistrationUrl('https://huddinge.alvis.se/provning/amnesomrade')).toBe('booking');
    expect(classifyRegistrationUrl('https://provningsenheten.alvis.se/hittakurser/kurs/12372')).toBe('booking');
  });

  it('does not treat every Alvis page as a booking form', () => {
    // A bare sign-in screen is not "a few steps from registered".
    expect(classifyRegistrationUrl('https://norrkoping.alvis.se/login')).toBe('info');
  });

  it('treats a provider webshop product page as a booking form', () => {
    expect(classifyRegistrationUrl('https://shop.medlearn.se/produkt/provning-for-betyg-i-taby/')).toBe('booking');
  });

  it('flags municipal e-services separately, since they need BankID first', () => {
    expect(classifyRegistrationUrl('https://sjalvservice.lulea.se/Provningsanmalan')).toBe('etjanst');
    expect(classifyRegistrationUrl('https://minasidor.sandviken.se/oversikt/overview/267')).toBe('etjanst');
    expect(classifyRegistrationUrl('https://pitea.enamnd.se/oversikt/overview/1604')).toBe('etjanst');
    expect(classifyRegistrationUrl('https://www.eskilstuna.se/e-tjanster-och-blanketter/anmal-dig-till-provning-hos-komvux')).toBe('etjanst');
  });

  it('flags a PDF as a blankett', () => {
    expect(classifyRegistrationUrl('https://lapplands.se/media/5onakr4r/anmalan-till-provning.pdf')).toBe('blankett');
  });

  it('falls back to info for a plain municipal page', () => {
    expect(classifyRegistrationUrl('https://www.uppsala.se/skola-forskola-och-komvux/komvux/studera-pa-komvux/provning/')).toBe('info');
  });

  it('does not throw on a malformed URL', () => {
    expect(classifyRegistrationUrl('not a url')).toBe('info');
  });

  it('has copy for every kind it can return', () => {
    for (const exam of EXAMS) {
      const kind = classifyRegistrationUrl(exam.registrationUrl);
      expect(REGISTRATION_KIND_META[kind], `${exam.id} → ${kind}`).toBeDefined();
    }
  });
});
