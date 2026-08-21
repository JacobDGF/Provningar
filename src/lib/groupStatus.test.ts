import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Exam } from '../types';
import { ACTIONABILITY, bestStatusKey, summarizeGroup, summarizeBy } from './groupStatus';
import { STATUS_ORDER, getStatusKey, StatusKey } from './examStatusColor';

const TODAY = '2026-08-21T09:00:00Z';

function exam(id: string, over: Partial<Exam> = {}): Exam {
  return {
    id,
    schoolName: 'Skola',
    provider: 'Kommun',
    subject: 'Matematik',
    course: 'Matematik 1a',
    courseCode: 'MATMAT01a',
    level: 'Komvux',
    city: 'Ort',
    region: 'Skåne',
    address: 'Gatan 1',
    lat: 0,
    lng: 0,
    price: 500,
    priceNote: '',
    nextPeriod: { label: '', confirmed: false },
    components: [],
    studyTips: [],
    registrationUrl: 'https://example.se/anmalan',
    infoUrl: 'https://example.se/',
    description: '',
    tags: [],
    verifiedAt: '2026-08-21',
    ...over,
  } as Exam;
}

/** One listing per colour, so a group can be built out of known parts. */
const BY_STATUS: Record<StatusKey, Exam> = {
  open: exam('open', {
    nextPeriod: { label: '', applicationEnd: '2026-10-01', confirmed: true },
  }),
  closing: exam('closing', {
    nextPeriod: { label: '', applicationEnd: '2026-08-24', confirmed: true },
  }),
  upcoming: exam('upcoming', {
    nextPeriod: { label: '', applicationStart: '2026-09-15', confirmed: true },
  }),
  undated: exam('undated'),
  closed: exam('closed', {
    nextPeriod: { label: '', applicationEnd: '2026-07-01', confirmed: true },
  }),
  full: exam('full', {
    nextPeriod: { label: '', applicationEnd: '2026-10-01', full: true, confirmed: true },
  }),
};

describe('groupStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TODAY));
  });
  afterEach(() => vi.useRealTimers());

  it('builds each fixture in the colour it is named for', () => {
    for (const [key, e] of Object.entries(BY_STATUS)) {
      expect(getStatusKey(e)).toBe(key);
    }
  });

  it('covers every status exactly once, so no colour can go unranked', () => {
    expect([...ACTIONABILITY].sort()).toEqual([...STATUS_ORDER].sort());
  });

  it('has no status in the group', () => {
    expect(bestStatusKey([])).toBeNull();
    expect(summarizeGroup([])).toEqual({ count: 0, key: null, tone: null, bookable: 0 });
  });

  it('takes the best colour in the group, not the first or the worst', () => {
    expect(bestStatusKey([BY_STATUS.full, BY_STATUS.open])).toBe('open');
    expect(bestStatusKey([BY_STATUS.closed, BY_STATUS.upcoming])).toBe('upcoming');
    expect(bestStatusKey([BY_STATUS.closing, BY_STATUS.open])).toBe('open');
  });

  it('never spends red on a group with anything bookable in it', () => {
    for (const bookable of [BY_STATUS.open, BY_STATUS.closing]) {
      expect(bestStatusKey([BY_STATUS.full, BY_STATUS.full, bookable])).not.toBe('full');
    }
    // Red is left for the group where every single listing is fullbokat.
    expect(bestStatusKey([BY_STATUS.full, BY_STATUS.full])).toBe('full');
  });

  it('ranks an undated listing above one whose deadline has passed', () => {
    // "The school has not published dates" is a page worth opening; "you
    // missed it in July" is not, so the group's colour should offer the first.
    expect(bestStatusKey([BY_STATUS.closed, BY_STATUS.undated])).toBe('undated');
  });

  it('counts what you can act on today, which is not the whole group', () => {
    const summary = summarizeGroup([
      BY_STATUS.open,
      BY_STATUS.closing,
      BY_STATUS.closed,
      BY_STATUS.full,
      BY_STATUS.undated,
    ]);
    expect(summary.count).toBe(5);
    expect(summary.bookable).toBe(2);
    expect(summary.key).toBe('open');
    expect(summary.tone?.key).toBe('open');
  });

  it('groups by a field and keeps each group to its own listings', () => {
    const byRegion = summarizeBy(
      [
        exam('a', { region: 'Skåne', nextPeriod: BY_STATUS.open.nextPeriod }),
        exam('b', { region: 'Skåne' }),
        exam('c', { region: 'Blekinge', nextPeriod: BY_STATUS.full.nextPeriod }),
      ],
      'region',
    );
    expect(byRegion.get('Skåne')?.count).toBe(2);
    expect(byRegion.get('Skåne')?.key).toBe('open');
    expect(byRegion.get('Blekinge')?.count).toBe(1);
    expect(byRegion.get('Blekinge')?.key).toBe('full');
    expect(byRegion.get('Dalarna')).toBeUndefined();
  });
});
