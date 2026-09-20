import { describe, it, expect } from 'vitest';
import { COURSE_PAIRS, courseCounterpart } from './courseSystems';
import { EXAMS } from '../data/exams';

describe('courseCounterpart', () => {
  it('reads the pair from either side', () => {
    expect(courseCounterpart('MATMAT03b')).toEqual({
      system: 'gy11',
      other: { code: 'MATO1B00X', name: 'Matematik – fortsättning Nivå 1b' },
    });
    expect(courseCounterpart('MATO1B00X')).toEqual({
      system: 'gy25',
      other: { code: 'MATMAT03b', name: 'Matematik 3b' },
    });
  });

  it('tolerates the case and spacing a kurskod is typed with', () => {
    expect(courseCounterpart(' matmat02b ')?.other.code).toBe('MATE2B00X');
  });

  /**
   * Silence is the answer for a course no source has put on one row. Örebro
   * lists Fysik 1a and Fysik nivå 1b separately; Helsingborg writes them on
   * the same row, with the same 150 poäng on both sides, so that pair is now
   * published and the app may say it.
   *
   * Matematik specialisering is the case that stays silent: the same Gy11 code
   * faces two different ämnesnivåer on two rows, so there is no single
   * counterpart to name — and naming one of them would send somebody to the
   * wrong prov, which is exactly what this table exists to prevent.
   */
  it('says nothing about a course no source has paired to exactly one other', () => {
    expect(courseCounterpart('MATMAT00S')).toBeUndefined();
    expect(courseCounterpart('BIOBIT0')).toBeUndefined();
    expect(courseCounterpart('SFIKUB92')).toBeUndefined();
  });

  /** A pair a second source published on one row, with matching poäng. */
  it('pairs Fysik 1a with Fysik Nivå 1b, the way Helsingborg publishes it', () => {
    expect(courseCounterpart('FYSFYS01a')?.other.code).toBe('FYSK1B00X');
    expect(courseCounterpart('FYSK1B00X')?.other.code).toBe('FYSFYS01a');
  });

  it('pairs each code exactly once, and never with itself', () => {
    const codes = COURSE_PAIRS.flatMap((p) => [p.gy11.code, p.gy25.code]);
    expect(new Set(codes).size).toBe(codes.length);
    for (const pair of COURSE_PAIRS) expect(pair.gy11.code).not.toBe(pair.gy25.code);
  });

  /**
   * The names are the dataset's own spelling of each code. If a listing later
   * renames a course, the pair has to follow — otherwise search offers a name
   * no card carries, and the detail line names a course the user can't find.
   */
  it('spells every paired course the way the dataset spells it', () => {
    const namesByCode = new Map<string, Set<string>>();
    for (const e of EXAMS) {
      if (!namesByCode.has(e.courseCode)) namesByCode.set(e.courseCode, new Set());
      namesByCode.get(e.courseCode)!.add(e.course);
    }
    const drifted: string[] = [];
    for (const variant of COURSE_PAIRS.flatMap((p) => [p.gy11, p.gy25])) {
      const names = namesByCode.get(variant.code);
      if (names && !names.has(variant.name)) {
        drifted.push(`${variant.code}: ${variant.name} ≠ ${[...names].join(' / ')}`);
      }
    }
    expect(drifted).toEqual([]);
  });
});
