import { describe, expect, it } from 'vitest';
import { EXAMS, SUBJECTS, REGIONS, CITIES } from './exams';

/**
 * The product's one promise is that these facts are real and checked. These
 * guard the invariants that promise depends on — a listing that violates any
 * of them is showing a user something we cannot stand behind.
 */
describe('EXAMS dataset', () => {
  it('is not empty', () => {
    expect(EXAMS.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const seen = new Map<string, number>();
    for (const e of EXAMS) seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1)).toEqual([]);
  });

  it('links only to absolute https URLs', () => {
    for (const e of EXAMS) {
      for (const field of ['registrationUrl', 'infoUrl'] as const) {
        const url = e[field];
        expect(() => new URL(url), `${e.id}.${field}`).not.toThrow();
        expect(new URL(url).protocol, `${e.id}.${field}`).toBe('https:');
      }
    }
  });

  it('never presents a fabricated date as confirmed', () => {
    // `confirmed: true` is what unlocks countdowns, "öppen just nu" badges and
    // calendar entries, so it must be backed by at least one real date.
    for (const e of EXAMS) {
      if (!e.nextPeriod.confirmed) continue;
      const { applicationStart, applicationEnd, examWindowStart, examWindowEnd } = e.nextPeriod;
      expect(
        [applicationStart, applicationEnd, examWindowStart, examWindowEnd].some(Boolean),
        `${e.id} is confirmed but carries no date`,
      ).toBe(true);
    }
  });

  it('uses parseable ISO dates that run forwards', () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    for (const e of EXAMS) {
      const p = e.nextPeriod;
      for (const [field, value] of Object.entries(p)) {
        if (typeof value !== 'string' || field === 'label') continue;
        expect(value, `${e.id}.${field}`).toMatch(iso);
        expect(Number.isNaN(Date.parse(value)), `${e.id}.${field}`).toBe(false);
      }
      if (p.applicationStart && p.applicationEnd) {
        expect(p.applicationStart <= p.applicationEnd, `${e.id} application window is inverted`).toBe(true);
      }
      if (p.examWindowStart && p.examWindowEnd) {
        expect(p.examWindowStart <= p.examWindowEnd, `${e.id} exam window is inverted`).toBe(true);
      }
      if (p.applicationEnd && p.examWindowStart) {
        expect(p.applicationEnd <= p.examWindowStart, `${e.id} closes applications after the exam`).toBe(true);
      }
      expect(e.verifiedAt, `${e.id}.verifiedAt`).toMatch(iso);
    }
  });

  it('places every listing inside Sweden', () => {
    // Catches a swapped lat/lng or a stray zero, which would otherwise drop a
    // pin in the Gulf of Guinea and quietly break distance sorting.
    for (const e of EXAMS) {
      expect(e.lat, `${e.id}.lat`).toBeGreaterThan(55);
      expect(e.lat, `${e.id}.lat`).toBeLessThan(70);
      expect(e.lng, `${e.id}.lng`).toBeGreaterThan(10);
      expect(e.lng, `${e.id}.lng`).toBeLessThan(25);
    }
  });

  it('charges no more than the statutory 500 kr cap', () => {
    for (const e of EXAMS) {
      expect(e.price, `${e.id}.price`).toBeGreaterThanOrEqual(0);
      expect(e.price, `${e.id}.price`).toBeLessThanOrEqual(500);
    }
  });

  it('carries the text every listing renders', () => {
    for (const e of EXAMS) {
      for (const field of ['schoolName', 'provider', 'subject', 'course', 'city', 'region', 'address', 'description'] as const) {
        expect(e[field]?.trim(), `${e.id}.${field}`).toBeTruthy();
      }
      expect(e.components.length, `${e.id}.components`).toBeGreaterThan(0);
      expect(e.studyTips.length, `${e.id}.studyTips`).toBeGreaterThan(0);
    }
  });

  it('derives filter options from the data', () => {
    expect(SUBJECTS).toEqual([...SUBJECTS].sort());
    expect(REGIONS).toEqual([...REGIONS].sort());
    expect(new Set(CITIES).size).toBe(CITIES.length);
    expect(SUBJECTS).toContain(EXAMS[0].subject);
  });
});
