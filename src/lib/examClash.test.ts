import { describe, it, expect } from 'vitest';
import { findClashes, writingDaysOf } from './examClash';
import { EXAMS } from '../data/exams';
import { Exam, NextPeriod } from '../types';

function exam(id: string, period: Partial<NextPeriod>, over: Partial<Exam> = {}): Exam {
  return {
    id,
    schoolName: 'Komvux Test',
    provider: 'Testkommun',
    subject: 'Matematik',
    course: 'Matematik 2b',
    courseCode: 'MATMAT02b',
    level: 'Komvux',
    city: 'Teststad',
    region: 'Skåne',
    address: 'Testgatan 1',
    lat: 55.6,
    lng: 13.0,
    price: 500,
    nextPeriod: { label: 'Testperiod', confirmed: true, ...period },
    components: [{ name: 'Prov', duration: '4 timmar', description: 'Skriftligt.' }],
    studyTips: ['Läs boken.'],
    registrationUrl: 'https://example.se/anmalan',
    infoUrl: 'https://example.se/provning',
    description: 'Test.',
    tags: ['test'],
    verifiedAt: '2026-09-13',
    ...over,
  };
}

describe('writingDaysOf', () => {
  it('reads a published skrivschema', () => {
    const e = exam('a', {
      writingDays: ['2026-10-26', '2026-10-30'],
      examWindowStart: '2026-10-26',
      examWindowEnd: '2026-11-25',
    });
    expect(writingDaysOf(e)).toEqual(['2026-10-26', '2026-10-30']);
  });

  it('treats a one-day window as that day', () => {
    const e = exam('a', { examWindowStart: '2026-11-24', examWindowEnd: '2026-11-24' });
    expect(writingDaysOf(e)).toEqual(['2026-11-24']);
  });

  it('says nothing about a month-long window', () => {
    const e = exam('a', { examWindowStart: '2026-10-26', examWindowEnd: '2026-11-25' });
    expect(writingDaysOf(e)).toEqual([]);
  });

  it('ignores days on an unconfirmed period', () => {
    const e = exam('a', { confirmed: false, writingDays: ['2026-10-26'] });
    expect(writingDaysOf(e)).toEqual([]);
  });
});

describe('findClashes', () => {
  const a = exam('a', { writingDays: ['2026-10-26'] }, { course: 'Engelska 5' });
  const b = exam('b', { writingDays: ['2026-10-26'] }, { course: 'Historia 1b' });
  const c = exam('c', { writingDays: ['2026-10-29'] }, { course: 'Matematik 4' });

  it('finds two rounds written the same day', () => {
    const clashes = findClashes([a, b, c], '2026-09-13');
    expect(clashes).toHaveLength(1);
    expect(clashes[0].date).toBe('2026-10-26');
    expect(clashes[0].exams.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('leaves rounds on different days alone', () => {
    expect(findClashes([a, c], '2026-09-13')).toEqual([]);
  });

  it('knows when the clash is at one and the same school', () => {
    const elsewhere = exam(
      'd',
      { writingDays: ['2026-10-26'] },
      { schoolName: 'Komvux Annanstans' },
    );
    expect(findClashes([a, b], '2026-09-13')[0].sameSchool).toBe(true);
    expect(findClashes([a, elsewhere], '2026-09-13')[0].sameSchool).toBe(false);
  });

  /** A day that has been and gone is not a decision anybody can still make. */
  it('drops days already in the past', () => {
    expect(findClashes([a, b], '2026-11-01')).toEqual([]);
  });

  it('reports the soonest clash first', () => {
    const later = exam('e', { writingDays: ['2026-10-29'] }, { course: 'Matematik 5' });
    const clashes = findClashes([c, later, a, b], '2026-09-13');
    expect(clashes.map((k) => k.date)).toEqual(['2026-10-26', '2026-10-29']);
  });

  it('is not fooled by the same listing twice', () => {
    expect(findClashes([a, a], '2026-09-13')).toEqual([]);
  });

  /**
   * The dataset's own skrivscheman have to be able to collide, or the feature
   * is checking nothing: Komvux Malmö writes several courses each afternoon.
   */
  it('catches a real clash in the dataset', () => {
    const malmo = EXAMS.filter((e) => e.schoolName === 'Komvux Malmö');
    const clashes = findClashes(malmo, '2026-09-13');
    expect(clashes.length).toBeGreaterThan(0);
    expect(clashes.every((k) => k.sameSchool)).toBe(true);
  });
});
