import { describe, it, expect, vi, afterEach } from 'vitest';
import { openAlternatives } from './openAlternatives';
import { EXAMS } from '../data/exams';
import { isOpenForRegistration } from './examStatus';
import { Exam } from '../types';

function at(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

afterEach(() => vi.useRealTimers());

/** Helsingborg, Göteborg and Stockholm, roughly, so distances sort sensibly. */
const HBG = { lat: 56.0465, lng: 12.6945 };
const GBG = { lat: 57.7003, lng: 11.9867 };
const STHLM = { lat: 59.3045, lng: 18.1004 };

function exam(partial: Partial<Exam> & Pick<Exam, 'id' | 'courseCode'>): Exam {
  return {
    schoolName: partial.id,
    city: 'Helsingborg',
    lat: HBG.lat,
    lng: HBG.lng,
    nextPeriod: { label: '', confirmed: false },
    ...partial,
  } as Exam;
}

/** An open round: dated, inside the window, not full. */
function openPeriod(applicationEnd = '2026-12-01') {
  return { label: '', applicationStart: '2026-01-01', applicationEnd, confirmed: true };
}

const closedInHelsingborg = exam({
  id: 'hbg',
  courseCode: 'MATE2B00X',
  nextPeriod: {
    label: '',
    applicationStart: '2026-09-07',
    applicationEnd: '2026-09-11',
    confirmed: true,
  },
});

describe('openAlternatives', () => {
  it('finds the same course where it is still bookable', () => {
    at('2026-09-20T09:00:00Z');
    const found = openAlternatives(closedInHelsingborg, [
      closedInHelsingborg,
      exam({ id: 'gbg', courseCode: 'MATE2B00X', ...GBG, nextPeriod: openPeriod() }),
    ]);
    expect(found.map((a) => a.exam.id)).toEqual(['gbg']);
    expect(found[0].otherSystem).toBe(false);
  });

  /**
   * The point of the whole block: the round you are looking at is closed, and
   * the course's other name is where the open one lives. Without the pair the
   * app holds the answer and says nothing.
   */
  it('counts the same course under the other system’s name', () => {
    at('2026-09-20T09:00:00Z');
    const found = openAlternatives(closedInHelsingborg, [
      closedInHelsingborg,
      exam({ id: 'gy11', courseCode: 'MATMAT02b', ...GBG, nextPeriod: openPeriod() }),
    ]);
    expect(found.map((a) => a.exam.id)).toEqual(['gy11']);
    expect(found[0].otherSystem).toBe(true);
  });

  it('never offers a round nobody can book', () => {
    at('2026-09-20T09:00:00Z');
    const found = openAlternatives(closedInHelsingborg, [
      closedInHelsingborg,
      // Closed: the deadline is behind us.
      exam({
        id: 'stängd',
        courseCode: 'MATE2B00X',
        ...GBG,
        nextPeriod: { label: '', applicationEnd: '2026-09-01', confirmed: true },
      }),
      // Full, however the dates read.
      exam({
        id: 'fullbokad',
        courseCode: 'MATE2B00X',
        ...GBG,
        nextPeriod: { ...openPeriod(), full: true },
      }),
      // No published dates at all.
      exam({ id: 'odaterad', courseCode: 'MATE2B00X', ...GBG }),
    ]);
    expect(found).toEqual([]);
  });

  it('never offers another course, and never the listing itself', () => {
    at('2026-09-20T09:00:00Z');
    const found = openAlternatives(closedInHelsingborg, [
      { ...closedInHelsingborg, nextPeriod: openPeriod() },
      exam({ id: 'annan kurs', courseCode: 'MATE2C00X', ...GBG, nextPeriod: openPeriod() }),
    ]);
    expect(found).toEqual([]);
  });

  it('puts the nearest first, and the soonest deadline first at the same distance', () => {
    at('2026-09-20T09:00:00Z');
    const found = openAlternatives(
      closedInHelsingborg,
      [
        closedInHelsingborg,
        exam({ id: 'långt bort', courseCode: 'MATE2B00X', ...STHLM, nextPeriod: openPeriod() }),
        exam({
          id: 'nära, sent',
          courseCode: 'MATE2B00X',
          ...GBG,
          nextPeriod: openPeriod('2026-12-01'),
        }),
        exam({
          id: 'nära, snart',
          courseCode: 'MATE2B00X',
          ...GBG,
          nextPeriod: openPeriod('2026-10-01'),
        }),
      ],
      5,
    );
    expect(found.map((a) => a.exam.id)).toEqual(['nära, snart', 'nära, sent', 'långt bort']);
  });

  /**
   * Örebro publishes the same prövning twice, once per system, at one school
   * with one deadline. Two rows that lead to the same place are not two
   * alternatives — the one that stays is the one in the system the user is
   * already standing in, because that is the anmälan they can make.
   */
  it('keeps one row per provider, in the user’s own system', () => {
    at('2026-09-20T09:00:00Z');
    const found = openAlternatives(closedInHelsingborg, [
      closedInHelsingborg,
      exam({
        id: 'örebro-gy11',
        schoolName: 'Komvux Örebro',
        city: 'Örebro',
        courseCode: 'MATMAT02b',
        ...GBG,
        nextPeriod: openPeriod('2026-09-27'),
      }),
      exam({
        id: 'örebro-gy25',
        schoolName: 'Komvux Örebro',
        city: 'Örebro',
        courseCode: 'MATE2B00X',
        ...GBG,
        nextPeriod: openPeriod('2026-09-27'),
      }),
    ]);
    expect(found.map((a) => a.exam.id)).toEqual(['örebro-gy25']);
  });

  it('shows a few, not a second list to read', () => {
    at('2026-09-20T09:00:00Z');
    const many = Array.from({ length: 9 }, (_, i) =>
      exam({ id: `nr${i}`, courseCode: 'MATE2B00X', ...GBG, nextPeriod: openPeriod() }),
    );
    expect(openAlternatives(closedInHelsingborg, many)).toHaveLength(3);
  });

  /**
   * Against the real dataset, because the guarantee is about what ships: every
   * alternative the app offers has to be a round somebody can still book.
   */
  it('only ever returns bookable rounds from the real dataset', () => {
    for (const e of EXAMS) {
      for (const alt of openAlternatives(e, EXAMS)) {
        expect(isOpenForRegistration(alt.exam)).toBe(true);
        expect(alt.exam.id).not.toBe(e.id);
      }
    }
  });
});
