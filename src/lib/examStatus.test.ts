import { describe, it, expect, vi, afterEach } from 'vitest';
import { isOpenForRegistration, daysUntil } from './examStatus';
import { Exam, NextPeriod } from '../types';

function examWith(nextPeriod: NextPeriod): Exam {
  return { nextPeriod } as Exam;
}

function at(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

afterEach(() => vi.useRealTimers());

describe('isOpenForRegistration', () => {
  it('is open inside a full window', () => {
    at('2026-08-09T12:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-27',
          applicationEnd: '2026-08-23',
          confirmed: true,
        }),
      ),
    ).toBe(true);
  });

  it('is open on the closing day itself, right up to midnight', () => {
    at('2026-08-23T22:30:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-27',
          applicationEnd: '2026-08-23',
          confirmed: true,
        }),
      ),
    ).toBe(true);
  });

  it('is closed the day after', () => {
    at('2026-08-24T09:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-27',
          applicationEnd: '2026-08-23',
          confirmed: true,
        }),
      ),
    ).toBe(false);
  });

  it('is closed before the window opens', () => {
    at('2026-07-01T09:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-27',
          applicationEnd: '2026-08-23',
          confirmed: true,
        }),
      ),
    ).toBe(false);
  });

  // Several providers only ever publish a closing date.
  it('treats a deadline with no stated opening as open', () => {
    at('2026-08-09T12:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationEnd: '2026-08-11',
          confirmed: true,
        }),
      ),
    ).toBe(true);
  });

  it('never reports an unconfirmed period as open', () => {
    at('2026-08-09T12:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-27',
          applicationEnd: '2026-08-23',
          confirmed: false,
        }),
      ),
    ).toBe(false);
  });

  it('is closed when there is no deadline at all', () => {
    at('2026-08-09T12:00:00Z');
    expect(isOpenForRegistration(examWith({ label: '', confirmed: true }))).toBe(false);
  });
});

describe('daysUntil', () => {
  it('counts whole days ahead', () => {
    at('2026-08-09T00:00:00Z');
    expect(daysUntil('2026-08-11')).toBe(2);
  });

  it('goes negative once the date has passed', () => {
    at('2026-08-12T00:00:00Z');
    expect(daysUntil('2026-08-11')).toBeLessThan(0);
  });
});

describe('open-ended application windows', () => {
  it('is open once an opening date has passed and no closing date is published', () => {
    at('2026-08-09T12:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-01',
          confirmed: true,
        }),
      ),
    ).toBe(true);
  });

  it('is still closed before that opening date', () => {
    at('2026-06-01T12:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-07-01',
          confirmed: true,
        }),
      ),
    ).toBe(false);
  });
});
