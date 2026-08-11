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

  it('resolves a registration flow for every listing', () => {
    for (const exam of EXAMS) {
      const flow = getRegistrationFlow(exam);
      expect(flow.steps.length).toBeGreaterThanOrEqual(2);
      expect(flow.ctaLabel.trim()).not.toBe('');
      expect(flow.landing.trim()).not.toBe('');
    }
  });
});
