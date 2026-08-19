import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isOpenForRegistration,
  isFullyBooked,
  hasApplicationClosed,
  hasPeriodPassed,
  compareByPeriod,
  daysUntil,
} from './examStatus';
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

  it('is closed inside the window when the provider says the round is full', () => {
    at('2026-08-15T12:00:00Z');
    expect(
      isOpenForRegistration(
        examWith({
          label: '',
          applicationStart: '2026-08-10',
          applicationEnd: '2026-08-31',
          confirmed: true,
          full: true,
        }),
      ),
    ).toBe(false);
  });
});

describe('isFullyBooked', () => {
  it('is true only when the provider published the round as full', () => {
    expect(isFullyBooked(examWith({ label: '', confirmed: true, full: true }))).toBe(true);
    expect(isFullyBooked(examWith({ label: '', confirmed: true }))).toBe(false);
    expect(isFullyBooked(examWith({ label: '', confirmed: true, full: false }))).toBe(false);
  });

  // "Full" and "not open" are different answers to the user: one sends you to
  // the next round, the other to a date in your calendar.
  it('is independent of whether the window is open', () => {
    at('2026-09-30T12:00:00Z');
    const closedAndFull = examWith({
      label: '',
      applicationStart: '2026-08-10',
      applicationEnd: '2026-08-31',
      confirmed: true,
      full: true,
    });
    expect(isOpenForRegistration(closedAndFull)).toBe(false);
    expect(isFullyBooked(closedAndFull)).toBe(true);
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

describe('hasApplicationClosed', () => {
  it('is false while the deadline is still ahead', () => {
    at('2026-09-20T12:00:00Z');
    expect(
      hasApplicationClosed(examWith({ label: '', applicationEnd: '2026-09-27', confirmed: true })),
    ).toBe(false);
  });

  it('is false on the closing day itself, right up to midnight', () => {
    at('2026-09-27T22:00:00Z');
    expect(
      hasApplicationClosed(examWith({ label: '', applicationEnd: '2026-09-27', confirmed: true })),
    ).toBe(false);
  });

  it('is true the day after the deadline', () => {
    at('2026-09-28T08:00:00Z');
    expect(
      hasApplicationClosed(examWith({ label: '', applicationEnd: '2026-09-27', confirmed: true })),
    ).toBe(true);
  });

  // A round with no published deadline can't have missed one — the user is
  // told to check with the provider, not that they are too late.
  it('is false when no deadline is published', () => {
    at('2027-01-01T08:00:00Z');
    expect(
      hasApplicationClosed(
        examWith({ label: '', applicationStart: '2026-09-01', confirmed: true }),
      ),
    ).toBe(false);
    expect(hasApplicationClosed(examWith({ label: '', confirmed: false }))).toBe(false);
  });
});

describe('hasPeriodPassed', () => {
  it('is false while the exam window is still ahead', () => {
    at('2026-10-01T12:00:00Z');
    expect(
      hasPeriodPassed(
        examWith({
          label: '',
          applicationEnd: '2026-09-27',
          examWindowStart: '2026-10-26',
          examWindowEnd: '2026-10-28',
          confirmed: true,
        }),
      ),
    ).toBe(false);
  });

  it('is true once the last exam day is behind us', () => {
    at('2026-10-29T09:00:00Z');
    expect(
      hasPeriodPassed(
        examWith({
          label: '',
          applicationEnd: '2026-09-27',
          examWindowStart: '2026-10-26',
          examWindowEnd: '2026-10-28',
          confirmed: true,
        }),
      ),
    ).toBe(true);
  });
});

describe('compareByPeriod', () => {
  const named = (schoolName: string, nextPeriod: NextPeriod) =>
    ({ schoolName, nextPeriod }) as Exam;
  const soon = named('B', { label: '', applicationEnd: '2026-09-27', confirmed: true });
  const later = named('C', { label: '', applicationEnd: '2026-11-30', confirmed: true });
  const undated = named('D', { label: '', confirmed: false });
  const over = named('A', { label: '', applicationEnd: '2026-08-04', confirmed: true });

  it('puts the nearest deadline still ahead of the user first', () => {
    at('2026-09-01T12:00:00Z');
    expect([later, soon].sort(compareByPeriod).map((e) => e.schoolName)).toEqual(['B', 'C']);
  });

  // The bug this exists for: a deadline in the past sorts smallest as a string,
  // so "närmast i tiden" led with rounds that closed weeks ago.
  it('sinks a round whose deadline has passed below one that has not', () => {
    at('2026-09-01T12:00:00Z');
    expect([over, soon].sort(compareByPeriod).map((e) => e.schoolName)).toEqual(['B', 'A']);
  });

  it('sinks it below an undated listing too — that one might still be bookable', () => {
    at('2026-09-01T12:00:00Z');
    expect([over, undated].sort(compareByPeriod).map((e) => e.schoolName)).toEqual(['D', 'A']);
  });

  it('keeps dated rounds ahead of undated ones', () => {
    at('2026-09-01T12:00:00Z');
    expect([undated, soon].sort(compareByPeriod).map((e) => e.schoolName)).toEqual(['B', 'D']);
  });
});
