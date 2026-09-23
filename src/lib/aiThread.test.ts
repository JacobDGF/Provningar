import { describe, it, expect } from 'vitest';
import { EXAMS } from '../data/exams';
import { answerAsk, readAsk } from './askProvningar';
import {
  carriedSentence,
  followUpSuggestions,
  historyFor,
  localAnswer,
  makeTurn,
} from './aiThread';

/** Fixed so a test never depends on what month it is run in. */
const TODAY = new Date('2026-08-30T12:00:00Z');

const turn = (question: string, previous?: Parameters<typeof answerAsk>[3]) =>
  makeTurn(question, answerAsk(question, EXAMS, TODAY, previous), `t-${question}`);

describe('localAnswer', () => {
  it('opens with the reading, so a misread question costs one glance', () => {
    const answer = localAnswer(answerAsk('Matte 2b i Göteborg', EXAMS, TODAY));
    expect(answer).toMatch(/^Jag läste frågan som Matematik 2b i Göteborg\./);
  });

  it('asks for a kurs and an ort when it read neither', () => {
    const answer = localAnswer(answerAsk('hej kan du hjälpa mig', EXAMS, TODAY));
    expect(answer).toContain('Skriv gärna med');
    expect(answer).not.toContain('Jag läste frågan som');
  });

  /** Widening is allowed; doing it quietly is not. */
  it('says so when it had to drop the constraints to find anything', () => {
    const answer = localAnswer(answerAsk('Historia 1b i Göteborg', EXAMS, TODAY));
    expect(answer).toContain('hela träfflistan i stället');
  });

  it('names what a follow-up inherited instead of pretending the user said it', () => {
    const first = readAsk('Matte 2b', EXAMS, TODAY);
    const answer = localAnswer(answerAsk('visa bara de i Göteborg', EXAMS, TODAY, first));
    expect(answer).toContain('Jag läste frågan som Matematik 2b i Göteborg');
    expect(answer).toContain('Matematik 2b är kvar från din förra fråga.');
  });

  it('says nothing about inheritance on a first question', () => {
    expect(localAnswer(answerAsk('Matte 2b i Göteborg', EXAMS, TODAY))).not.toContain(
      'förra fråga',
    );
  });
});

describe('carriedSentence', () => {
  it('is null when nothing was carried', () => {
    expect(carriedSentence(turn('Matte 2b i Göteborg'))).toBeNull();
  });

  it('names every axis it took over', () => {
    const first = readAsk('Matte 2b i Göteborg', EXAMS, TODAY);
    const followUp = turn('vad kostar de?', first);
    expect(carriedSentence(followUp)).toBe('Matematik 2b i Göteborg är kvar från din förra fråga.');
  });
});

describe('makeTurn', () => {
  it('answers out of the dataset first, with the model not yet in the loop', () => {
    const t = turn('Matte 2b i Göteborg');
    expect(t.fromModel).toBe(false);
    expect(t.understood).toBe(true);
    expect(t.matches.length).toBeGreaterThan(0);
    // The reading travels with the turn, because it is what the next question
    // gets read against.
    expect(t.ask.courses).toEqual(['Matematik 2b']);
  });

  it('marks a question it could not read, so the model is never asked about it', () => {
    expect(turn('hej kan du hjälpa mig').understood).toBe(false);
  });
});

describe('historyFor', () => {
  it('replays the exchanges in order', () => {
    const first = turn('Matte 2b');
    const second = turn('visa bara de i Göteborg', first.ask);
    expect(historyFor([first, second])).toEqual([
      { question: first.question, answer: first.answer },
      { question: second.question, answer: second.answer },
    ]);
  });

  /**
   * An unread question's answer is the app asking for a kurs and an ort. In a
   * transcript that reads as the assistant having refused, which is both untrue
   * and no help in answering the next question.
   */
  it('leaves out a question the app could not read', () => {
    const history = historyFor([turn('hej'), turn('Matte 2b')]);
    expect(history).toHaveLength(1);
    expect(history[0].question).toBe('Matte 2b');
  });
});

describe('followUpSuggestions', () => {
  it('offers the narrowing that removes the most rows', () => {
    const t = turn('Matte 2b');
    const suggestions = followUpSuggestions(t, false);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatch(/^Visa bara de i /);
    // Narrowing to somewhere the matches actually are.
    const city = suggestions[0].replace('Visa bara de i ', '');
    expect(t.matches.some((e) => e.city === city)).toBe(true);
  });

  it('does not offer an ort when the question already named one', () => {
    const suggestions = followUpSuggestions(turn('Matte 2b i Göteborg'), false);
    expect(suggestions.filter((s) => s.startsWith('Visa bara'))).toEqual([]);
  });

  /**
   * The prose follow-ups need a model to read them. Offering them to a build
   * that answers out of the dataset alone would promise a paragraph the app
   * cannot write.
   */
  it('keeps the prose follow-ups for builds that have a model', () => {
    const t = turn('Matte 2b i Göteborg');
    expect(followUpSuggestions(t, false)).toEqual([]);
    expect(followUpSuggestions(t, true)).toContain('Vad kostar de?');
  });

  it('suggests nothing when there is nothing to follow up on', () => {
    expect(followUpSuggestions(turn('hej'), true)).toEqual([]);
    expect(followUpSuggestions(turn('Fysik 2 i Kiruna'), true)).toEqual([]);
  });
});
