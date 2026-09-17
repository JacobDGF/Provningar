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
   * Silence is the answer for a course no published table has paired. Fysik 3
   * and the sfi courses stand alone in both sources, and Matematik
   * specialisering is worse than unpaired: Helsingborg's table maps the one
   * Gy11 course onto two Gy25 ämnesnivåer (B and C), so there is no single
   * other name to give. Guessing any of them would send somebody to the wrong
   * prov.
   */
  it('says nothing about a course no source has paired', () => {
    expect(courseCounterpart('FYSFYS03')).toBeUndefined();
    expect(courseCounterpart('MATMAT00S')).toBeUndefined();
    expect(courseCounterpart('MASB1000X')).toBeUndefined();
    expect(courseCounterpart('SFIKUB92')).toBeUndefined();
  });

  /**
   * Fysik 1a used to be the example of an unpaired course, because Örebro's
   * table lists it and Fysik nivå 1b on separate rows. Helsingborg's
   * comparison table prints them on one row, at the same 150 poäng — a pair
   * read out of a source, which is exactly what this file holds.
   */
  it('takes a pair the second source writes out', () => {
    expect(courseCounterpart('FYSFYS01a')?.other.code).toBe('FYSK1B00X');
    expect(courseCounterpart('FYSK1A20X')?.other.code).toBe('FYSFYS01b2');
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
