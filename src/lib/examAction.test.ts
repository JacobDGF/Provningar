import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Exam, NextPeriod } from '../types';
import { EXAMS } from '../data/exams';
import { getExamAction } from './examAction';
import { getExamStatus } from './examStatusColor';

const TODAY = '2026-09-15T09:00:00.000Z';

function exam(nextPeriod: NextPeriod, overrides: Partial<Exam> = {}): Exam {
  return {
    id: 'test',
    schoolName: 'Testskolan',
    provider: 'Testkommun',
    subject: 'Matematik',
    course: 'Matematik 2b',
    courseCode: 'MATMAT02b',
    level: 'Komvux',
    city: 'Teststad',
    region: 'Stockholm',
    address: 'Testgatan 1',
    lat: 59,
    lng: 18,
    price: 500,
    nextPeriod,
    components: [],
    studyTips: [],
    registrationUrl: 'https://bokning.example.se/anmalan',
    infoUrl: 'https://skolan.example.se/provning',
    description: '',
    tags: [],
    verifiedAt: '2026-09-01',
    ...overrides,
  };
}

function days(offset: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(TODAY));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getExamAction', () => {
  it('never offers a booking button on a round the provider says is full', () => {
    // The bug this exists for: dates that read as open, a round that is not,
    // and a brand-blue "Anmäl dig" leading to a form headed "anmälan stängd".
    const action = getExamAction(
      exam({
        label: 'Höst 2026',
        applicationStart: days(-10),
        applicationEnd: days(10),
        confirmed: true,
        full: true,
      }),
    );
    expect(action.variant).toBe('full');
    expect(action.live).toBe(false);
    expect(action.primary.label).toMatch(/Fullbokat/);
  });

  it('sends a full round at the provider page, not the dead form', () => {
    const action = getExamAction(
      exam({ label: 'H26', applicationEnd: days(10), confirmed: true, full: true }),
    );
    expect(action.primary.href).toBe('https://skolan.example.se/provning');
    // The booking link is still reachable — cancellations happen — but it is
    // demoted and no longer the thing the eye lands on.
    expect(action.secondary?.href).toBe('https://bokning.example.se/anmalan');
  });

  it('uses the provider homepage when the booking page is the only page', () => {
    const url = 'https://skolan.example.se/provning';
    const action = getExamAction(
      exam(
        { label: 'H26', applicationEnd: days(10), confirmed: true, full: true },
        { registrationUrl: url, infoUrl: url },
      ),
    );
    // providerLinks derives the homepage in this case, and a homepage that
    // loads beats a form that opens with "anmälan är stängd".
    expect(action.primary.href).toBe('https://skolan.example.se/');
    expect(action.primary.label).toMatch(/Fullbokat/);
    expect(action.secondary?.href).toBe(url);
  });

  it('still points somewhere when there is no second destination at all', () => {
    const action = getExamAction(
      exam(
        { label: 'H26', applicationEnd: days(10), confirmed: true, full: true },
        { registrationUrl: 'https://bokning.example.se/anmalan', infoUrl: 'not a url' },
      ),
    );
    // Nothing usable to demote to, so the booking link stays the target — but
    // the label still must not promise a seat.
    expect(action.primary.href).toBe('https://bokning.example.se/anmalan');
    expect(action.primary.label).toMatch(/Fullbokat/);
    expect(action.secondary).toBeUndefined();
  });

  it('says when a closed round closed, in the button itself', () => {
    const action = getExamAction(
      exam({
        label: 'H26',
        applicationStart: days(-30),
        applicationEnd: days(-4),
        confirmed: true,
      }),
    );
    expect(action.variant).toBe('closed');
    expect(action.live).toBe(false);
    expect(action.primary.label).toMatch(/Stängde/);
  });

  it('keeps the ordinary booking flow on an open round', () => {
    const action = getExamAction(
      exam({ label: 'H26', applicationStart: days(-5), applicationEnd: days(20), confirmed: true }),
    );
    expect(action.variant).toBe('book');
    expect(action.live).toBe(true);
    expect(action.primary.href).toBe('https://bokning.example.se/anmalan');
    expect(action.secondary?.label).toBe('Skolans sida');
  });

  it('still books on a round closing in three days', () => {
    // Amber is urgency, not closure — the button has to stay a booking.
    const action = getExamAction(
      exam({ label: 'H26', applicationStart: days(-5), applicationEnd: days(3), confirmed: true }),
    );
    expect(action.variant).toBe('book');
    expect(action.live).toBe(true);
  });

  it('books on an undated listing rather than declaring it closed', () => {
    const action = getExamAction(exam({ label: 'Se skolans sida', confirmed: false }));
    expect(action.variant).toBe('book');
    expect(action.live).toBe(true);
  });
});

describe('across the whole dataset', () => {
  it('marks a listing live if and only if its colour says it is bookable', () => {
    for (const e of EXAMS) {
      const key = getExamStatus(e).tone.key;
      const closedByColour = key === 'full' || key === 'closed';
      expect(getExamAction(e).live).toBe(!closedByColour);
    }
  });

  it('always has somewhere to send the user', () => {
    for (const e of EXAMS) {
      const action = getExamAction(e);
      expect(action.primary.href).toMatch(/^https:\/\//);
      expect(action.primary.label.trim()).not.toBe('');
    }
  });
});
