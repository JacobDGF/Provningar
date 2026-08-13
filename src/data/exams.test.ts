import { describe, it, expect } from 'vitest';
import { EXAMS } from './exams';
import { getRegistrationFlow } from '../lib/registrationFlow';

/**
 * The dataset is the product. Everything else in the app is a view onto it, so
 * a bad row — a duplicate id, a date range that runs backwards, a listing that
 * claims a confirmed period without saying when — ships as a wrong answer to
 * somebody deciding whether they can still book a prövning this term. These
 * guard the shapes a reviewer can't eyeball across ~90 hand-written entries.
 */

/** Rough bounding box for Sweden, generous at the edges. */
const SWEDEN = { minLat: 55.2, maxLat: 69.1, minLng: 10.8, maxLng: 24.2 };

describe('EXAMS dataset', () => {
  it('is non-empty', () => {
    expect(EXAMS.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const seen = new Map<string, number>();
    for (const e of EXAMS) seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1)).toEqual([]);
  });

  it.each(EXAMS.map((e) => [e.id, e] as const))('%s is well formed', (_id, exam) => {
    for (const field of [
      'schoolName',
      'provider',
      'subject',
      'course',
      'courseCode',
      'city',
      'region',
      'address',
      'description',
    ] as const) {
      expect(exam[field].trim()).not.toBe('');
    }
    expect(exam.price).toBeGreaterThanOrEqual(0);
    expect(exam.tags.length).toBeGreaterThan(0);
    expect(exam.components.length).toBeGreaterThan(0);
    expect(exam.studyTips.length).toBeGreaterThan(0);
    expect(exam.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(EXAMS.map((e) => [e.id, e] as const))('%s points at https URLs', (_id, exam) => {
    for (const url of [exam.registrationUrl, exam.infoUrl]) {
      expect(() => new URL(url)).not.toThrow();
      expect(new URL(url).protocol).toBe('https:');
    }
  });

  it.each(EXAMS.map((e) => [e.id, e] as const))('%s sits inside Sweden', (_id, exam) => {
    expect(exam.lat).toBeGreaterThanOrEqual(SWEDEN.minLat);
    expect(exam.lat).toBeLessThanOrEqual(SWEDEN.maxLat);
    expect(exam.lng).toBeGreaterThanOrEqual(SWEDEN.minLng);
    expect(exam.lng).toBeLessThanOrEqual(SWEDEN.maxLng);
  });

  it.each(EXAMS.map((e) => [e.id, e] as const))('%s has coherent dates', (_id, exam) => {
    const { nextPeriod: p } = exam;
    for (const d of [p.applicationStart, p.applicationEnd, p.examWindowStart, p.examWindowEnd]) {
      if (d !== undefined) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    if (p.applicationStart && p.applicationEnd) {
      expect(p.applicationStart <= p.applicationEnd).toBe(true);
    }
    if (p.examWindowStart && p.examWindowEnd) {
      expect(p.examWindowStart <= p.examWindowEnd).toBe(true);
    }
    // A window with only one end is a half-written entry, not a fact.
    expect(Boolean(p.examWindowStart) === Boolean(p.examWindowEnd)).toBe(true);
    expect(p.label.trim()).not.toBe('');
  });

  it('never claims a confirmed period without a real date', () => {
    const bad = EXAMS.filter(
      (e) =>
        e.nextPeriod.confirmed &&
        !e.nextPeriod.applicationStart &&
        !e.nextPeriod.applicationEnd &&
        !e.nextPeriod.examWindowStart,
    );
    expect(bad.map((e) => e.id)).toEqual([]);
  });

  it('never carries dates on an unconfirmed period', () => {
    const bad = EXAMS.filter(
      (e) =>
        !e.nextPeriod.confirmed &&
        (e.nextPeriod.applicationStart ||
          e.nextPeriod.applicationEnd ||
          e.nextPeriod.examWindowStart),
    );
    expect(bad.map((e) => e.id)).toEqual([]);
  });

  /**
   * The one flow that leaves work on the user's desk.
   *
   * Every other kind lands somewhere that *is* the booking, or says plainly
   * that it isn't (a blankett, an e-postadress, a form that goes up on a named
   * date). A bare `page` says "leta upp anmälningslänken på sidan" and hopes.
   * That is sometimes the truth — a few providers really do bury the link — but
   * it is also what a listing looks like when nobody has checked it yet, and
   * the two are indistinguishable from the outside.
   *
   * So the set is pinned rather than counted. Adding a listing that only
   * reaches an information page is allowed; doing it without noticing is not.
   * Fixing one means deleting a line here, which is the good direction.
   */
  it('names every listing that only reaches an information page', () => {
    const stranded = EXAMS.filter((e) => !e.registration && getRegistrationFlow(e).kind === 'page');
    expect(stranded.map((e) => e.id).sort()).toEqual([
      // Jönköping: the kommun says anmälan sker "via e-tjänsten" but publishes
      // no link to it, and their självservice portal has no prövning entry.
      'komvux-i-jonkoping-jonkoping-flera-kurser-kontakta-skolan-fo',
      // Komvux Södermalm: the site refuses automated requests (503), so the
      // registration route can only be re-checked by hand.
      'sodermalm-fysik2',
      'sodermalm-kemi1',
      // Skövde: the prövningssida lists courses and nothing else — no form, no
      // e-tjänst, no address, only kommunens växel.
      'vuxenutbildning-skovde-skovde-matematik-3b',
      'vuxenutbildning-skovde-skovde-svenska-3',
    ]);
  });

  it('resolves a registration flow for every listing', () => {
    for (const exam of EXAMS) {
      const flow = getRegistrationFlow(exam);
      expect(flow.steps.length).toBeGreaterThanOrEqual(2);
      expect(flow.ctaLabel.trim()).not.toBe('');
      expect(flow.landing.trim()).not.toBe('');
    }
  });
});
