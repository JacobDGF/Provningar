import { describe, it, expect } from 'vitest';
import { EXAMS } from '../data/exams';
import { Exam } from '../types';
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

/**
 * A real row with only its period rewritten.
 *
 * The vocabulary has to come out of `EXAMS` — the reader knows no city or kurs
 * the dataset doesn't contain — but the periods must not. Which rounds are open
 * on a given day is exactly what the dataset changes every term, so a test that
 * reads a real round's dates proves the logic right only until that provider's
 * round runs out. Both assertions below used to do that, and both went red the
 * day Prövningsenheten Göteborgs höstomgångar were written.
 */
function rowWithPeriod(id: string, nextPeriod: Exam['nextPeriod']): Exam {
  const row = EXAMS.find((e) => e.id === id);
  if (!row) throw new Error(`Fixturen utgår från ${id}, som inte finns i EXAMS.`);
  return { ...row, nextPeriod };
}

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
    const exams = [
      rowWithPeriod('goteborg-matmat01b', {
        label: 'Öppen, och skrivs i september.',
        applicationEnd: '2026-09-15',
        examWindowStart: '2026-09-29',
        examWindowEnd: '2026-09-29',
        confirmed: true,
      }),
      rowWithPeriod('malmo-komvux-matematik-1b', {
        label: 'Öppen, men skrivs i november.',
        applicationEnd: '2026-09-18',
        examWindowStart: '2026-11-02',
        examWindowEnd: '2026-11-02',
        confirmed: true,
      }),
      rowWithPeriod('orebro-matmat01b', {
        label: 'Anordnaren har inte publicerat några datum.',
        confirmed: false,
      }),
    ];
    const { matches, widened } = answerAsk('Matematik 1b innan oktober', exams, TODAY);
    expect(widened).toBe(false);
    expect(matches.map((m) => m.id)).toEqual(['goteborg-matmat01b']);
  });

  /**
   * Widening is allowed; doing it quietly is not. The flag is what the tab
   * prints, and without it a list of closed rounds reads as a list of open ones.
   */
  it('flags the answer when it had to drop the constraints to find anything', () => {
    const exams = [
      rowWithPeriod('goteborg-hishis01b', {
        label: 'Anmälan stängde 27 augusti.',
        applicationEnd: '2026-08-27',
        examWindowStart: '2026-09-24',
        examWindowEnd: '2026-09-24',
        confirmed: true,
      }),
    ];
    const { matches, widened } = answerAsk('Historia 1b i Göteborg', exams, TODAY);
    expect(matches.map((m) => m.id)).toEqual(['goteborg-hishis01b']);
    expect(widened).toBe(true);
  });

  /**
   * A listing without published dates is not a closed one. The provider has
   * said nothing about when, so the card shows no period and links out — and
   * dropping it from the answer would turn "vi vet inte när" into "det finns
   * inget", which is the one thing the dataset is built never to say. The whole
   * of Prövningsenheten Göteborg sits in that state between two terms.
   */
  it('counts a listing without published dates as still worth acting on', () => {
    const exams = [
      rowWithPeriod('goteborg-hishis01b', {
        label: 'Vårens prövningar publiceras den 1 december.',
        confirmed: false,
      }),
    ];
    const { matches, widened } = answerAsk('Historia 1b i Göteborg', exams, TODAY);
    expect(matches.map((m) => m.id)).toEqual(['goteborg-hishis01b']);
    expect(widened).toBe(false);
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
