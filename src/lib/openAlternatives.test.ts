import { describe, it, expect } from 'vitest';
import { Exam } from '../types';
import { EXAMS } from '../data/exams';
import { isOpenForRegistration } from './examStatus';
import { isBlocked, openAlternatives } from './openAlternatives';

/** Days from today as an ISO date, so the fixtures don't age. */
function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function exam(overrides: Partial<Exam> & { id: string }): Exam {
  return {
    schoolName: `Skola ${overrides.id}`,
    provider: 'Kommunen',
    subject: 'Matematik',
    course: 'Matematik 2b',
    courseCode: 'MATMAT02b',
    level: 'Komvux',
    city: 'Helsingborg',
    region: 'Skåne',
    address: 'Gatan 1',
    lat: 56,
    lng: 12.7,
    price: 500,
    nextPeriod: {
      label: 'Anmälan öppen',
      applicationStart: day(-3),
      applicationEnd: day(14),
      confirmed: true,
    },
    components: [{ name: 'Prov', duration: '3 h', description: 'Skriftligt prov.' }],
    studyTips: ['Räkna gamla nationella prov.'],
    registrationUrl: 'https://example.se/anmalan',
    infoUrl: 'https://example.se',
    description: 'En prövning.',
    tags: ['matematik'],
    verifiedAt: '2026-09-18',
    ...overrides,
  };
}

const closed = exam({
  id: 'stangd',
  city: 'Helsingborg',
  nextPeriod: {
    label: 'Anmälan stängde',
    applicationStart: day(-20),
    applicationEnd: day(-4),
    examWindowStart: day(20),
    examWindowEnd: day(40),
    confirmed: true,
  },
});

describe('isBlocked', () => {
  it('is true for a passed deadline and for a full round', () => {
    expect(isBlocked(closed)).toBe(true);
    expect(
      isBlocked(
        exam({
          id: 'full',
          nextPeriod: { label: 'Fullbokat', applicationEnd: day(9), confirmed: true, full: true },
        }),
      ),
    ).toBe(true);
  });

  /** Odaterad är inte stängd. Ingen vet, och då får ingen utväg utlovas. */
  it('is false for an open round and for one with no dates', () => {
    expect(isBlocked(exam({ id: 'oppen' }))).toBe(false);
    expect(
      isBlocked(exam({ id: 'odaterad', nextPeriod: { label: 'Se skolan', confirmed: false } })),
    ).toBe(false);
  });
});

describe('openAlternatives', () => {
  it('finds the same course, open, somewhere else', () => {
    const elsewhere = exam({ id: 'goteborg', city: 'Göteborg' });
    expect(openAlternatives(closed, [closed, elsewhere]).map((e) => e.id)).toEqual(['goteborg']);
  });

  it('says nothing when the listing itself is still open', () => {
    const open = exam({ id: 'oppen' });
    const elsewhere = exam({ id: 'goteborg', city: 'Göteborg' });
    expect(openAlternatives(open, [open, elsewhere])).toEqual([]);
  });

  it('never offers a round that is closed or full itself', () => {
    const alsoClosed = exam({ ...closed, id: 'ocksa-stangd', city: 'Malmö' });
    const full = exam({
      id: 'fullbokad',
      city: 'Lund',
      nextPeriod: { label: 'Fullbokat', applicationEnd: day(9), confirmed: true, full: true },
    });
    expect(openAlternatives(closed, [closed, alsoClosed, full])).toEqual([]);
  });

  /**
   * Matematik 2b och Matematik 3b är två prov. Ett förslag som byter kurs är
   * värre än inget förslag, eftersom det ser ut som ett svar.
   */
  it('never crosses over to another course in the same subject', () => {
    const otherCourse = exam({
      id: 'ma3b',
      city: 'Göteborg',
      course: 'Matematik 3b',
      courseCode: 'MATMAT03b',
    });
    expect(openAlternatives(closed, [closed, otherCourse])).toEqual([]);
  });

  /** Gy11-kursen och Gy25-nivån är samma innehåll — men bara när en källa har
      skrivit ut paret, vilket `courseSystems` är den enda domaren över. */
  it('counts the Gy25 level as the same course as its Gy11 course', () => {
    const gy25 = exam({
      id: 'gy25',
      city: 'Göteborg',
      course: 'Matematik Nivå 2b',
      courseCode: 'MATE2B00X',
    });
    expect(openAlternatives(closed, [closed, gy25]).map((e) => e.id)).toEqual(['gy25']);
  });

  /** `Varierar` är inte en kurs, så två listningar med den koden har ingenting
      gemensamt att erbjuda varandra. */
  it('ignores listings whose course code stands for "flera kurser"', () => {
    const vague = exam({ ...closed, id: 'vag', courseCode: 'Varierar' });
    const otherVague = exam({ id: 'ocksa-vag', city: 'Göteborg', courseCode: 'Varierar' });
    expect(openAlternatives(vague, [vague, otherVague])).toEqual([]);
  });

  it('puts the soonest deadline first and stops at the limit', () => {
    const soon = exam({
      id: 'snart',
      city: 'Göteborg',
      nextPeriod: { ...exam({ id: 'x' }).nextPeriod, applicationEnd: day(3) },
    });
    const later = exam({
      id: 'senare',
      city: 'Malmö',
      nextPeriod: { ...exam({ id: 'x' }).nextPeriod, applicationEnd: day(30) },
    });
    const middle = exam({
      id: 'mitten',
      city: 'Lund',
      nextPeriod: { ...exam({ id: 'x' }).nextPeriod, applicationEnd: day(10) },
    });
    const all = [closed, later, soon, middle];
    expect(openAlternatives(closed, all).map((e) => e.id)).toEqual(['snart', 'mitten', 'senare']);
    expect(openAlternatives(closed, all, { limit: 2 }).map((e) => e.id)).toEqual([
      'snart',
      'mitten',
    ]);
  });

  /** En skola som prövar samma kurs under båda koderna är en utväg, inte två. */
  it('lists each school once', () => {
    const gy11 = exam({ id: 'skolan-gy11', city: 'Göteborg', schoolName: 'Samma skola' });
    const gy25 = exam({
      id: 'skolan-gy25',
      city: 'Göteborg',
      schoolName: 'Samma skola',
      course: 'Matematik Nivå 2b',
      courseCode: 'MATE2B00X',
    });
    expect(openAlternatives(closed, [closed, gy11, gy25]).map((e) => e.id)).toEqual([
      'skolan-gy11',
    ]);
  });

  /** Mot den riktiga datan: varje förslag ska gå att söka till i dag, och det
      ska aldrig vara listningen man redan tittar på. */
  it('only ever offers open listings from the real dataset', () => {
    for (const e of EXAMS) {
      for (const alternative of openAlternatives(e, EXAMS)) {
        expect(isOpenForRegistration(alternative)).toBe(true);
        expect(alternative.id).not.toBe(e.id);
      }
    }
  });
});
