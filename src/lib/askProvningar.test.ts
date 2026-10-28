import { describe, it, expect } from 'vitest';
import { EXAMS } from '../data/exams';
import { answerAsk, describeAsk, hasConstraints, readAsk } from './askProvningar';
import { hasApplicationClosed, isFullyBooked } from './examStatus';

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
   * The cutoff binds the answer that still claims to honour it, and only that
   * one. Once the constraints find nothing the tab widens and says so, and the
   * list under a widened answer is allowed to hold anything the stad and kursen
   * matched. Naming one question here pinned the test to a round that happened
   * to have strict hits on the day it was written — 'Matematik 1b innan
   * oktober' widens now that Göteborgs omgång har lapsed — so the promise is
   * checked wherever it is still made, across every kurs in the data.
   */
  it('keeps a deadline out of the results it promises are before it', () => {
    let kept = 0;
    for (const course of new Set(EXAMS.map((e) => e.course))) {
      const { matches, widened } = answerAsk(`${course} innan december`, EXAMS, TODAY);
      if (widened || !matches.length) continue;
      kept++;
      for (const m of matches) {
        const when = m.nextPeriod.examWindowStart || m.nextPeriod.applicationEnd;
        expect(m.nextPeriod.confirmed && when && when < '2026-12-01').toBe(true);
      }
    }
    // A vacuous pass would mean every question widened, which is its own bug.
    expect(kept).toBeGreaterThan(0);
  });

  /**
   * Widening is allowed; doing it quietly is not. The flag is what the tab
   * prints, and without it a list of closed rounds reads as a list of open ones.
   */
  it('flags the answer when it had to drop the constraints to find anything', () => {
    // Asked of the data rather than of one named listning, for the same reason
    // as above: the round that was stängd when this was written is ofastställd
    // today, and an undated listning is not something the search dropped. The
    // rule that has to keep holding is the one the flag exists for — if every
    // listning it shows is one nobody can book, it has to say it widened.
    let flagged = 0;
    for (const pair of new Set(EXAMS.map((e) => `${e.course}\u0000${e.city}`))) {
      const [course, city] = pair.split('\u0000');
      const { matches, widened } = answerAsk(`${course} i ${city}`, EXAMS, TODAY);
      if (!matches.length) continue;
      const allShut = matches.every((m) => hasApplicationClosed(m, TODAY) || isFullyBooked(m));
      if (!allShut) continue;
      expect(widened).toBe(true);
      flagged++;
    }
    expect(flagged).toBeGreaterThan(0);
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
