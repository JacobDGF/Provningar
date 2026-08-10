import { afterEach, describe, expect, it, vi } from 'vitest';
import { daysUntil, isOpenForRegistration } from './examStatus';
import { Exam } from '../types';

function exam(nextPeriod: Exam['nextPeriod']): Exam {
  return {
    id: 'x', schoolName: 'S', provider: 'P', subject: 'Matematik', course: 'Matematik 1a',
    courseCode: 'MATMAT01a', level: 'Komvux', city: 'Ort', region: 'Region', address: 'Adress',
    lat: 59, lng: 18, price: 500, nextPeriod, components: [], studyTips: [],
    registrationUrl: 'https://example.se/', infoUrl: 'https://example.se/',
    description: 'd', tags: [], verifiedAt: '2026-01-01',
  };
}

afterEach(() => vi.useRealTimers());

function at(date: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(date));
}

describe('isOpenForRegistration', () => {
  const window = { label: 'l', applicationStart: '2026-08-01', applicationEnd: '2026-08-31', confirmed: true };

  it('is open inside the window', () => {
    at('2026-08-10T12:00:00Z');
    expect(isOpenForRegistration(exam(window))).toBe(true);
  });

  it('is closed before and after', () => {
    at('2026-07-31T12:00:00Z');
    expect(isOpenForRegistration(exam(window))).toBe(false);
    at('2026-09-01T12:00:00Z');
    expect(isOpenForRegistration(exam(window))).toBe(false);
  });

  it('is open on the opening day', () => {
    // The window starts at midnight, so any time on the first day counts.
    at('2026-08-01T09:00:00Z');
    expect(isOpenForRegistration(exam(window))).toBe(true);
  });

  it('never claims a listing is open without confirmed dates', () => {
    at('2026-08-10T12:00:00Z');
    expect(isOpenForRegistration(exam({ ...window, confirmed: false }))).toBe(false);
    expect(isOpenForRegistration(exam({ label: 'l', confirmed: true }))).toBe(false);
    expect(isOpenForRegistration(exam({ label: 'l', applicationStart: '2026-08-01', confirmed: true }))).toBe(false);
  });
});

describe('daysUntil', () => {
  it('counts whole days forward', () => {
    at('2026-08-10T00:00:00Z');
    expect(daysUntil('2026-08-17')).toBe(7);
  });

  it('returns 0 on the day itself and goes negative after', () => {
    at('2026-08-17T00:00:00Z');
    expect(daysUntil('2026-08-17')).toBe(0);
    at('2026-08-18T00:00:00Z');
    expect(daysUntil('2026-08-17')).toBeLessThan(0);
  });
});
