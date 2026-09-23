import { describe, it, expect } from 'vitest';
import { EXAMS } from '../data/exams';
import { answerAsk, describeAsk, describeAxes, hasConstraints, readAsk } from './askProvningar';

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

describe('describeAsk', () => {
  it('says the reading back in the words the user could correct', () => {
    const ask = readAsk('Matte 2b i Göteborg innan december', EXAMS, TODAY);
    expect(describeAsk(ask)).toBe('Matematik 2b i Göteborg före december');
  });
});

/**
 * The half that makes the tab a conversation rather than a row of unrelated
 * searches. "Visa bara de i Göteborg" is a complete thing to say to a person,
 * and it carries no kurs — the kurs is in the message before it.
 */
describe('answerAsk med en tidigare fråga', () => {
  const first = readAsk('Matte 2b', EXAMS, TODAY);

  it('narrows the previous question instead of starting a new one', () => {
    const { ask, matches, carried } = answerAsk('visa bara de i Göteborg', EXAMS, TODAY, first);
    expect(ask.courses).toEqual(['Matematik 2b']);
    expect(ask.cities).toEqual(['Göteborg']);
    expect(carried).toEqual(['ämne']);
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m.course).toBe('Matematik 2b');
      expect(m.city).toBe('Göteborg');
    }
  });

  it('adds a deadline to a question that already had a kurs and an ort', () => {
    const withCity = readAsk('Matte 2b i Göteborg', EXAMS, TODAY);
    const { ask, carried } = answerAsk('hinner jag innan december?', EXAMS, TODAY, withCity);
    expect(ask.before).toBe('2026-12-01');
    expect(carried).toEqual(['ämne', 'plats']);
  });

  /**
   * The reason merging is per axis. An ämne and a kurs are two answers to the
   * same question, so a new ämne has to push the old kurs out — carrying both
   * would filter for a listing that is Engelska and Matematik 2b at once.
   */
  it('replaces the whole ämne axis when the follow-up names a new subject', () => {
    const { ask } = answerAsk('och engelska då?', EXAMS, TODAY, first);
    expect(ask.subjects).toEqual(['Engelska']);
    expect(ask.courses).toEqual([]);
  });

  it('replaces the ort rather than adding to it', () => {
    const inGbg = readAsk('Matte 2b i Göteborg', EXAMS, TODAY);
    const { ask } = answerAsk('finns det i Malmö istället', EXAMS, TODAY, inGbg);
    expect(ask.cities).toEqual(['Malmö']);
  });

  /** An inherited constraint you cannot drop is a room with no door. */
  it('lets the user ask an axis back', () => {
    const inGbg = readAsk('Matte 2b i Göteborg', EXAMS, TODAY);
    const { ask, carried } = answerAsk('visa överallt', EXAMS, TODAY, inGbg);
    expect(ask.cities).toEqual([]);
    expect(ask.regions).toEqual([]);
    expect(carried).toEqual(['ämne']);
  });

  it('keeps the whole reading for a follow-up that names nothing', () => {
    const full = readAsk('Matte 2b i Göteborg innan december', EXAMS, TODAY);
    const { ask, carried } = answerAsk('vad kostar de?', EXAMS, TODAY, full);
    expect(ask).toEqual(full);
    expect(carried).toEqual(['ämne', 'plats', 'tid']);
    // Carried constraints still count as constraints, so the tab does not fall
    // back to "jag hittade inget ämne" on a question the user can see is clear.
    expect(hasConstraints(ask)).toBe(true);
  });

  it('carries nothing when there is no previous question', () => {
    expect(answerAsk('Matte 2b i Göteborg', EXAMS, TODAY).carried).toEqual([]);
  });

  it('names the inherited part in the same words as the reading', () => {
    const { ask, carried } = answerAsk('visa bara de i Göteborg', EXAMS, TODAY, first);
    expect(describeAxes(ask, carried)).toBe('Matematik 2b');
    expect(describeAsk(ask)).toBe('Matematik 2b i Göteborg');
  });
});
