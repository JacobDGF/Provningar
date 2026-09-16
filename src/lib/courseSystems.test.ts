import { describe, it, expect } from 'vitest';
import { COURSE_PAIRS, courseCounterpart, courseSystemOf } from './courseSystems';
import { COURSE_SYSTEM_BY_CODE, UNCLASSIFIED_CODES } from './courseSystemIndex';
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
   * Silence is the answer for a course only one system has. Fysik 1a and Fysik
   * nivå 1b sit on separate rows in the source table, and pairing them here
   * because the names look adjacent would tell somebody to sit the wrong prov.
   */
  it('says nothing about a course no source has paired', () => {
    expect(courseCounterpart('FYSFYS01a')).toBeUndefined();
    expect(courseCounterpart('FYSK1B00X')).toBeUndefined();
    expect(courseCounterpart('SFIKUB92')).toBeUndefined();
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

describe('courseSystemOf', () => {
  it('reads the läroplan out of Skolverkets index', () => {
    expect(courseSystemOf('MATMAT03b')).toBe('gy11');
    expect(courseSystemOf('MATO1B00X')).toBe('gy25');
    expect(courseSystemOf(' mate2b00x ')).toBe('gy25');
  });

  /**
   * The pair table and the index are two different sources — Örebros tabell and
   * Skolverkets API — answering the same question for the courses they share.
   * They must not disagree: the app filters on one and explains with the other,
   * so a listing could otherwise be hidden as Gy25 while its detail line calls
   * it a Gy11-kurs.
   */
  it('agrees with every pair the Örebro table spelled out', () => {
    const disagreements: string[] = [];
    for (const pair of COURSE_PAIRS) {
      for (const [expected, variant] of [
        ['gy11', pair.gy11],
        ['gy25', pair.gy25],
      ] as const) {
        const actual = courseSystemOf(variant.code);
        if (actual !== expected) disagreements.push(`${variant.code}: ${actual} ≠ ${expected}`);
      }
    }
    expect(disagreements).toEqual([]);
  });

  /**
   * `undefined` is an answer, not a gap. A grundläggande kurs and an sfi-kurs
   * belong to neither läroplan, and a row covering several courses belongs to
   * both — all three have to stay visible whichever way the user answers "när
   * läste du kursen", which is exactly what an unknown system buys them.
   */
  it('says nothing about a code outside the two läroplaner', () => {
    expect(courseSystemOf('GRNMAT2')).toBeUndefined();
    expect(courseSystemOf('SFIKUB92')).toBeUndefined();
    expect(courseSystemOf('Varierar')).toBeUndefined();
  });

  it('classifies nearly every kurskod in the dataset', () => {
    const codes = [...new Set(EXAMS.map((e) => e.courseCode))];
    // The unclassified set is small and deliberate; a code appearing here that
    // the generated file doesn't list is one nobody looked up.
    const unknown = codes.filter((c) => !courseSystemOf(c));
    expect(unknown.sort()).toEqual([...UNCLASSIFIED_CODES].sort());
  });

  it('never claims both läroplaner for one code', () => {
    for (const code of Object.keys(COURSE_SYSTEM_BY_CODE)) {
      expect(['gy11', 'gy25']).toContain(COURSE_SYSTEM_BY_CODE[code]);
    }
    for (const code of UNCLASSIFIED_CODES) {
      expect(COURSE_SYSTEM_BY_CODE[code]).toBeUndefined();
    }
  });
});
