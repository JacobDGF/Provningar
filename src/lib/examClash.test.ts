import { describe, it, expect } from 'vitest';
import { findClashes, clashDayLabel } from './examClash';
import { EXAMS } from '../data/exams';
import { Exam } from '../types';

const base: Exam = {
  id: 'x',
  schoolName: 'Komvux Malmö',
  provider: 'Malmö stad',
  subject: 'Matematik',
  course: 'Matematik 2b',
  courseCode: 'MATMAT02b',
  level: 'Komvux',
  city: 'Malmö',
  region: 'Skåne',
  address: 'Kungsgatan 44, Malmö',
  lat: 55.605,
  lng: 13.0038,
  price: 500,
  nextPeriod: { label: 'Period 4', confirmed: true, examDays: ['2026-10-29'] },
  components: [{ name: 'Prov', duration: '4 timmar', description: 'Skrivpass.' }],
  studyTips: ['Öva.'],
  registrationUrl: 'https://example.com/anmalan',
  infoUrl: 'https://example.com',
  description: 'Prövning.',
  tags: ['matematik'],
  verifiedAt: '2026-09-14',
};

/** `nextPeriod` is replaced wholesale, so a test can hand over one without days. */
const make = (over: Partial<Exam>): Exam => ({ ...base, ...over });

describe('findClashes', () => {
  it('finds two rounds written the same day at the same provider', () => {
    const a = make({ id: 'a' });
    const b = make({ id: 'b', course: 'Matematik Nivå 2b', courseCode: 'MATE2B00X' });
    const clashes = findClashes([a, b]);
    expect(clashes).toHaveLength(1);
    expect(clashes[0].date).toBe('2026-10-29');
    expect(clashes[0].exams.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('leaves a single saved round alone', () => {
    expect(findClashes([make({ id: 'a' })])).toEqual([]);
  });

  /** Two schools can both write on the 29th — you pick one school, not one day. */
  it('never clashes two different providers', () => {
    const a = make({ id: 'a' });
    const b = make({ id: 'b', schoolName: 'Komvux Lund', city: 'Lund' });
    expect(findClashes([a, b])).toEqual([]);
  });

  /**
   * The quiet failure this guards: a provider that dates the round but not the
   * course. Every autumn listing overlaps 26 October – 25 November, so reading
   * the window as a writing day would call an ordinary pair of saved rounds a
   * conflict and teach the user to ignore the warning.
   */
  it('says nothing when the provider has not published the day', () => {
    const a = make({ id: 'a', nextPeriod: { label: 'Höst', confirmed: true } });
    const b = make({ id: 'b', nextPeriod: { label: 'Höst', confirmed: true } });
    expect(findClashes([a, b])).toEqual([]);
  });

  it('ignores a round that is full or undated', () => {
    const a = make({ id: 'a' });
    const full = make({ id: 'b', nextPeriod: { ...base.nextPeriod, full: true } });
    const unconfirmed = make({ id: 'c', nextPeriod: { label: '?', confirmed: false } });
    expect(findClashes([a, full, unconfirmed])).toEqual([]);
  });

  it('counts two delprov of one listing as one prov', () => {
    const a = make({ id: 'a', nextPeriod: { ...base.nextPeriod, examDays: ['2026-10-27'] } });
    const b = make({
      id: 'b',
      nextPeriod: { ...base.nextPeriod, examDays: ['2026-10-27', '2026-10-27'] },
    });
    expect(findClashes([b])).toEqual([]);
    expect(findClashes([a, b])).toHaveLength(1);
  });

  it('reports the earliest clash first', () => {
    const early = make({ id: 'a', nextPeriod: { ...base.nextPeriod, examDays: ['2026-10-26'] } });
    const early2 = make({ id: 'b', nextPeriod: { ...base.nextPeriod, examDays: ['2026-10-26'] } });
    const late = make({ id: 'c' });
    const late2 = make({ id: 'd' });
    expect(findClashes([late, late2, early, early2]).map((c) => c.date)).toEqual([
      '2026-10-26',
      '2026-10-29',
    ]);
  });

  /**
   * The case the dataset makes likely: somebody unsure whether their betyg is
   * Gy11 or Gy25 saves both, and Malmö writes them the same afternoon.
   */
  it('catches the Gy11/Gy25 twins in the real dataset', () => {
    const gy11 = EXAMS.find((e) => e.id === 'malmo-komvux-matematik-2b')!;
    const gy25 = EXAMS.find((e) => e.id === 'malmo-komvux-matematik-niva-2b')!;
    expect(gy11.nextPeriod.examDays).toEqual(gy25.nextPeriod.examDays);
    const clashes = findClashes([gy11, gy25]);
    expect(clashes).toHaveLength(1);
    expect(clashes[0].schoolName).toBe('Komvux Malmö');
  });

  /** Everything the whole dataset can clash on is a day a provider published. */
  it('only ever fires on listings with a published writing day', () => {
    for (const clash of findClashes(EXAMS)) {
      for (const exam of clash.exams) {
        expect(exam.nextPeriod.examDays).toContain(clash.date);
      }
    }
  });
});

describe('clashDayLabel', () => {
  it('spells the day the way the skrivschema does', () => {
    expect(clashDayLabel('2026-10-29')).toBe('torsdag 29 oktober');
  });
});
