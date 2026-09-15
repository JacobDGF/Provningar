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
   * Silence is the answer until a source writes the pair out. Fysik 1a sat here
   * unpaired for as long as Örebro's table was the only source — it lists Fysik
   * 1a and Fysik nivå 1b on separate rows — and moved into the table the day
   * Helsingborg's jämförelselista put the two in the same row. The rest still
   * stand: a transition nobody has published stays unsaid.
   */
  it('says nothing about a course no source has paired', () => {
    // One Gy25 ämnesnivå for Datorteknik 1a *and* 1b — no one-to-one pair.
    expect(courseCounterpart('DAODAT01a')).toBeUndefined();
    expect(courseCounterpart('DATR1000X')).toBeUndefined();
    // Two Gy25 ämnesnivåer for one Gy11 kurskod, the other way round.
    expect(courseCounterpart('MASB1000X')).toBeUndefined();
    expect(courseCounterpart('SFIKUB92')).toBeUndefined();
  });

  /** A pair only earns its place once a source prints both codes on one row. */
  it('pairs Fysik 1a with Fysik Nivå 1b, which Helsingborgs table writes out', () => {
    expect(courseCounterpart('FYSFYS01a')?.other).toEqual({
      code: 'FYSK1B00X',
      name: 'Fysik Nivå 1b',
    });
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
