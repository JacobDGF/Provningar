import { describe, it, expect } from 'vitest';
import { EXAMS } from '../data/exams';
import { answerAsk, describeAsk, hasConstraints, readAsk } from './askProvningar';
import { hasApplicationClosed } from './examStatus';

/**
 * These run against the real dataset on purpose.
 *
 * The reader has no vocabulary of its own — every city, ämne and kurs it knows
 * is one `EXAMS` contains. A test with three fixture rows would therefore prove
 * nothing about the only question that matters: whether the sentence a real
 * user types finds the listings that are really there.
 */

/** Fixed so a test never depends on what month it is run in. */
const TODAY = new Date('2026-08-30T12:00:00Z');

describe('readAsk', () => {
  it('reads the sentence the tab is built for', () => {
    const ask = readAsk(
      'jag bor i Göteborg och vill höja mitt betyg i Matte 2b innan december',
      EXAMS,
      TODAY,
    );
    expect(ask.cities).toContain('Göteborg');
    expect(ask.courses).toContain('Matematik 2b');
    expect(ask.before).toBe('2026-12-01');
  });

  it('expands everyday short forms into the dataset’s own words', () => {
    expect(readAsk('matte 3c', EXAMS, TODAY).courses).toContain('Matematik 3c');
    expect(readAsk('sva 2 i Malmö', EXAMS, TODAY).courses).toContain('Svenska som andraspråk 2');
    expect(readAsk('pröva eng 6 i gbg', EXAMS, TODAY).cities).toContain('Göteborg');
  });

  it('finds a course by its kurskod', () => {
    expect(readAsk('vill pröva NAKNAK01b', EXAMS, TODAY).courses).toContain('Naturkunskap 1b');
  });

  it('reads a län as well as a kommun', () => {
    const ask = readAsk('Engelska 6 någonstans i Skåne', EXAMS, TODAY);
    expect(ask.regions).toEqual(['Skåne']);
    expect(ask.cities).toEqual([]);
  });

  /** "innan mars" in August is next March, not one that has already been. */
  it('anchors a month on today rather than on the calendar year', () => {
    expect(readAsk('klart innan mars', EXAMS, TODAY).before).toBe('2027-03-01');
    expect(readAsk('klart innan december', EXAMS, TODAY).before).toBe('2026-12-01');
  });

  it('only reads a month when the sentence asks for a deadline', () => {
    // "i december" is when they'd like to sit it, not a cutoff — inventing a
    // filter from it would silently hide every round in november.
    expect(readAsk('jag vill pröva i december', EXAMS, TODAY).before).toBeUndefined();
  });

  it('understands nothing in a sentence that names nothing', () => {
    expect(hasConstraints(readAsk('hej kan du hjälpa mig', EXAMS, TODAY))).toBe(false);
  });
});

describe('answerAsk', () => {
  it('returns only listings in the city that was asked for', () => {
    const { matches } = answerAsk('Matematik 2b i Göteborg', EXAMS, TODAY);
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m.city).toBe('Göteborg');
      expect(m.course).toBe('Matematik 2b');
    }
  });

  it('never returns a round whose deadline has passed while an open one exists', () => {
    const { matches, widened } = answerAsk('Engelska 6', EXAMS, TODAY);
    expect(widened).toBe(false);
    for (const m of matches) {
      const end = m.nextPeriod.applicationEnd;
      if (m.nextPeriod.confirmed && end) expect(end >= '2026-08-30').toBe(true);
    }
  });

  it('keeps a deadline out of the results it promises are before it', () => {
    const { matches } = answerAsk('Matematik 1b innan oktober', EXAMS, TODAY);
    for (const m of matches) {
      const when = m.nextPeriod.examWindowStart || m.nextPeriod.applicationEnd;
      expect(when && when < '2026-10-01').toBe(true);
    }
  });

  /**
   * Widening is allowed; doing it quietly is not. The flag is what the tab
   * prints, and without it a list of closed rounds reads as a list of open ones.
   */
  it('flags the answer when it had to drop the constraints to find anything', () => {
    const { matches, widened } = answerAsk('Historia 1b i Göteborg', EXAMS, TODAY);
    expect(matches.length).toBeGreaterThan(0);
    expect(widened).toBe(true);
  });

  it('finds nothing, and says nothing, for a course nobody offers there', () => {
    expect(answerAsk('Fysik 2 i Kiruna', EXAMS, TODAY).matches).toEqual([]);
  });
});

/**
 * A whole kommun closes at once — Helsingborg takes applications on four days
 * per period, Göteborg once a term — so "Matte 2b i Helsingborg" has weeks
 * where the honest answer is "not here, not now". These check the other half of
 * that answer: where it *is* still open, nearest first.
 */
describe('answerAsk, when the asked-for kommun has nothing to apply to', () => {
  /** Helsingborg's autumn application closed on 11 September. */
  const AFTER_HELSINGBORG_CLOSED = new Date('2026-09-17T12:00:00Z');

  it('offers the nearest kommun where the same course is still open', () => {
    const { elsewhere } = answerAsk('Matematik 2b i Helsingborg', EXAMS, AFTER_HELSINGBORG_CLOSED);
    expect(elsewhere.length).toBeGreaterThan(0);
    expect(elsewhere[0].exam.city).toBe('Malmö');
    expect(elsewhere[0].km).toBeLessThan(80);
    for (const { exam } of elsewhere) {
      expect(exam.city).not.toBe('Helsingborg');
      expect(exam.course).toBe('Matematik 2b');
      expect(hasApplicationClosed(exam, AFTER_HELSINGBORG_CLOSED)).toBe(false);
      expect(exam.nextPeriod.confirmed).toBe(true);
    }
  });

  it('keeps the suggestions nearest first, and one per ort', () => {
    const { elsewhere } = answerAsk('Historia 1b i Göteborg', EXAMS, TODAY);
    expect(elsewhere.length).toBeGreaterThan(0);
    expect(elsewhere.length).toBeLessThanOrEqual(3);
    const distances = elsewhere.map((e) => e.km);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
    const cities = elsewhere.map((e) => e.exam.city);
    expect(new Set(cities).size).toBe(cities.length);
  });

  /**
   * The suggestion is a second-best answer, and a second-best answer next to a
   * usable one is noise: it competes with the listing the user actually asked
   * for.
   */
  it('says nothing when the ort itself still has an open round', () => {
    expect(answerAsk('Matematik 2b i Göteborg', EXAMS, TODAY).elsewhere).toEqual([]);
  });

  /** Without a kurs or an ämne, "nearest open" would mean "nearest anything". */
  it('needs a course or a subject before it suggests an ort', () => {
    expect(
      answerAsk('finns det något i Helsingborg', EXAMS, AFTER_HELSINGBORG_CLOSED).elsewhere,
    ).toEqual([]);
  });
});

describe('describeAsk', () => {
  it('says the reading back in the words the user could correct', () => {
    const ask = readAsk('Matte 2b i Göteborg innan december', EXAMS, TODAY);
    expect(describeAsk(ask)).toBe('Matematik 2b i Göteborg före december');
  });
});
