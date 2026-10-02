import { describe, it, expect } from 'vitest';
import { EXAMS } from '../data/exams';
import { answerAsk, describeAsk, hasConstraints, readAsk } from './askProvningar';

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

  /**
   * The cutoff binds only the strict answer. When nothing survives the
   * deadline, `answerAsk` drops it deliberately and says so through `widened`,
   * and the matches are then the named set rather than a promise about dates —
   * so this asserts `widened` is false first, and the cutoff on that answer.
   *
   * The cutoff is december rather than oktober because Göteborg's Matematik 1b
   * now sits in the round that is still bookable on `TODAY` (provet 20 oktober,
   * anmälan stängde 22 september). "innan oktober" has no open round left to
   * find in any kommun, so it only exercised the widened path, where the
   * assertion below is not something the function claims.
   */
  it('keeps a deadline out of the results it promises are before it', () => {
    const { matches, widened } = answerAsk('Matematik 1b innan december', EXAMS, TODAY);
    expect(widened).toBe(false);
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      const when = m.nextPeriod.examWindowStart || m.nextPeriod.applicationEnd;
      expect(when && when < '2026-12-01').toBe(true);
    }
  });

  /**
   * Widening is allowed; doing it quietly is not. The flag is what the tab
   * prints, and without it a list of closed rounds reads as a list of open ones.
   */
  it('flags the answer when it had to drop the constraints to find anything', () => {
    // Göteborgs Historia 1b är odaterad igen — höstens omgång skrevs 24
    // september och vårens datum publiceras först 1 december. `fallsBefore`
    // svarar alltid nej på en operiod utan datum, så en fråga med en deadline
    // måste släppa den för att hitta något alls, och det är just den
    // släppningen flaggan ska göra synlig.
    const { matches, widened } = answerAsk('Historia 1b i Göteborg innan december', EXAMS, TODAY);
    expect(matches.length).toBeGreaterThan(0);
    expect(widened).toBe(true);
  });

  it('finds nothing, and says nothing, for a course nobody offers there', () => {
    expect(answerAsk('Fysik 2 i Kiruna', EXAMS, TODAY).matches).toEqual([]);
  });
});

describe('describeAsk', () => {
  it('says the reading back in the words the user could correct', () => {
    const ask = readAsk('Matte 2b i Göteborg innan december', EXAMS, TODAY);
    expect(describeAsk(ask)).toBe('Matematik 2b i Göteborg före december');
  });
});
