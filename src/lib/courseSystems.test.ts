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
   * Silence is the answer until a source writes the pair out. Psykologi 2 is
   * the standing case: Helsingborgs jämförelselista ger den samma kod som
   * Psykologi 1 (`PSYL1000X`), och att rätta den koden vore en gissning som
   * skickar någon till fel prov. Detsamma gäller Specialpedagogik 1, vars
   * Gy11-kod listan stavar `SPCSSPE01`.
   */
  it('says nothing about a course no source has paired', () => {
    expect(courseCounterpart('PSKPSY02')).toBeUndefined();
    expect(courseCounterpart('SPCSPE01')).toBeUndefined();
    expect(courseCounterpart('SFIKUB92')).toBeUndefined();
  });

  /**
   * Fysik 1a ↔ Fysik Nivå 1b was the old example of that silence — Örebro lists
   * the two without pairing them. Helsingborgs list puts them on one row, so the
   * pair is now read rather than guessed, and this is the case that says the
   * difference between the two is evidence and not taste.
   */
  it('pairs Fysik 1a with Fysik Nivå 1b, since a source now writes the row', () => {
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
