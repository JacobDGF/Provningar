import { describe, it, expect } from 'vitest';
import { describeClash, findExamClashes } from './examClashes';
import { EXAMS } from '../data/exams';
import { Exam } from '../types';

function exam(over: Partial<Exam> = {}): Exam {
  return {
    id: 'a',
    schoolName: 'Komvux Test',
    provider: 'Testkommun',
    subject: 'Matematik',
    course: 'Matematik 2b',
    courseCode: 'MATMAT02b',
    level: 'Komvux',
    city: 'Teststad',
    region: 'Stockholm',
    address: 'Testgatan 1',
    lat: 59.3,
    lng: 18.1,
    price: 500,
    nextPeriod: { label: 'Testperiod', confirmed: false },
    components: [{ name: 'Prov', duration: '2 h', description: 'Skriftligt.' }],
    studyTips: ['Läs boken.'],
    registrationUrl: 'https://example.se/anmalan',
    infoUrl: 'https://example.se/provning',
    description: 'Test.',
    tags: ['test'],
    verifiedAt: '2026-09-19',
    ...over,
  };
}

describe('findExamClashes', () => {
  it('finds nothing when no listing has a published sitting', () => {
    expect(findExamClashes([exam({ id: 'a' }), exam({ id: 'b' })])).toEqual([]);
  });

  it('finds nothing when the sittings fall on different days', () => {
    const clashes = findExamClashes([
      exam({ id: 'a', writtenExamDates: ['2026-10-26'] }),
      exam({ id: 'b', writtenExamDates: ['2026-10-27'] }),
    ]);
    expect(clashes).toEqual([]);
  });

  it('names both listings when one day carries two sittings', () => {
    const clashes = findExamClashes([
      exam({ id: 'a', writtenExamDates: ['2026-10-27'] }),
      exam({ id: 'b', writtenExamDates: ['2026-10-27'] }),
    ]);
    expect(clashes).toEqual([
      { date: '2026-10-27', schoolName: 'Komvux Test', examIds: ['a', 'b'] },
    ]);
  });

  /**
   * Två anordnare som råkar skriva samma dag är inte en krock appen kan påstå.
   * Tiderna publiceras var för sig, och det anordnaren själv skrivit ut är att
   * dess egna prov ligger ett per dag.
   */
  it('keeps two providers on the same day apart', () => {
    const clashes = findExamClashes([
      exam({ id: 'a', writtenExamDates: ['2026-10-27'] }),
      exam({ id: 'b', schoolName: 'Komvux Annan', writtenExamDates: ['2026-10-27'] }),
    ]);
    expect(clashes).toEqual([]);
  });

  it('treats the same school in two cities as two schools', () => {
    const clashes = findExamClashes([
      exam({ id: 'a', writtenExamDates: ['2026-10-27'] }),
      exam({ id: 'b', city: 'Annanstad', writtenExamDates: ['2026-10-27'] }),
    ]);
    expect(clashes).toEqual([]);
  });

  it('reports one clash per day, oldest first', () => {
    const clashes = findExamClashes([
      exam({ id: 'a', writtenExamDates: ['2026-10-27', '2026-10-30'] }),
      exam({ id: 'b', writtenExamDates: ['2026-10-30'] }),
      exam({ id: 'c', writtenExamDates: ['2026-10-27'] }),
    ]);
    expect(clashes.map((c) => [c.date, c.examIds])).toEqual([
      ['2026-10-27', ['a', 'c']],
      ['2026-10-30', ['a', 'b']],
    ]);
  });

  it('counts a listing once even if it repeats a date', () => {
    const clashes = findExamClashes([
      exam({ id: 'a', writtenExamDates: ['2026-10-27', '2026-10-27'] }),
    ]);
    expect(clashes).toEqual([]);
  });

  /**
   * Den riktiga datan är hela poängen: Komvux Malmö publicerar ett skrivpass
   * per kurs, och två kurser på samma eftermiddag är en anmälan anordnaren
   * inte behandlar.
   */
  it('catches a real pair of Malmö sittings on the same afternoon', () => {
    const fysik = EXAMS.find((e) => e.id === 'malmo-komvux-fysik-2')!;
    const programmering = EXAMS.find((e) => e.id === 'malmo-komvux-programmering-1')!;
    const biologi = EXAMS.find((e) => e.id === 'malmo-komvux-biologi-1')!;

    expect(findExamClashes([fysik, programmering])).toHaveLength(1);
    expect(findExamClashes([fysik, biologi])).toEqual([]);
  });
});

describe('describeClash', () => {
  const exams = [
    exam({ id: 'a', course: 'Fysik 2', writtenExamDates: ['2026-10-27'] }),
    exam({ id: 'b', course: 'Programmering 1', writtenExamDates: ['2026-10-27'] }),
    exam({ id: 'c', course: 'Psykologi 1', writtenExamDates: ['2026-10-27'] }),
  ];

  it('names the two courses, the day and the rule', () => {
    const [clash] = findExamClashes(exams.slice(0, 2));
    expect(describeClash(clash, exams)).toBe(
      'Fysik 2 och Programmering 1 är båda utsatta tisdag 27 oktober hos Komvux Test. ' +
        'Du kan bara skriva ett prov per dag.',
    );
  });

  it('lists three courses with a comma and an och', () => {
    const [clash] = findExamClashes(exams);
    expect(describeClash(clash, exams)).toContain('Fysik 2, Programmering 1 och Psykologi 1');
    expect(describeClash(clash, exams)).toContain('alla utsatta');
  });

  it('says nothing when the listings are not in hand', () => {
    const [clash] = findExamClashes(exams.slice(0, 2));
    expect(describeClash(clash, [])).toBe('');
  });
});
