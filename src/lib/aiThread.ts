import { Exam } from '../types';
import {
  Ask,
  AskAxis,
  AskResult,
  describeAsk,
  describeAxes,
  hasConstraints,
} from './askProvningar';

/**
 * One exchange in AI-prövning, and the words the app puts on it by itself.
 *
 * Split out of the tab for two reasons. The thread lives in the store now, so
 * the type has to be reachable from there — a conversation that vanished when
 * the user tapped "Upptäck" and came back was the clearest sign that the tab
 * was a search box wearing a chat's clothes. And the sentence above the cards
 * is the app's own claim about what it understood, which is the thing most
 * worth testing and the last thing that should only exist inside a component.
 */

export interface AiTurn {
  id: string;
  question: string;
  /** The prose above the cards, from the model or from our own reading. */
  answer: string;
  /** True when `answer` came from the model rather than from the dataset read. */
  fromModel: boolean;
  matches: Exam[];
  widened: boolean;
  understood: boolean;
  /** Axes this turn inherited from the turn before it. */
  carried: AskAxis[];
  /**
   * The reading this turn landed on.
   *
   * Carried on the turn because it is what the *next* question is read against.
   * Keeping it here rather than in a separate "current context" field means the
   * context can never drift from the answer the user is looking at.
   */
  ask: Ask;
}

/** "Matematik 2b är kvar från din förra fråga", when something is. */
export function carriedSentence(turn: Pick<AiTurn, 'ask' | 'carried'>): string | null {
  if (!turn.carried.length) return null;
  const inherited = describeAxes(turn.ask, turn.carried);
  if (!inherited) return null;
  return `${inherited} är kvar från din förra fråga.`;
}

/**
 * What the app itself can say about a reading, when no model is in the loop.
 *
 * Also what the model's answer replaces. Either way the paragraph opens with
 * the reading written out, because a misread question should cost one glance
 * rather than a confident paragraph — see `askProvningar.ts`.
 */
export function localAnswer(result: AskResult): string {
  if (!hasConstraints(result.ask)) {
    return (
      'Jag hittade inget ämne, ingen kurs och ingen ort i frågan. Skriv gärna med ' +
      'kursen och var du bor, till exempel "Matematik 2b i Göteborg".'
    );
  }

  const reading = describeAsk(result.ask);
  const carried = carriedSentence({ ask: result.ask, carried: result.carried });
  const suffix = carried ? ` ${carried}` : '';
  const n = result.matches.length;

  if (n === 0) {
    return (
      `Jag läste frågan som ${reading}, och hittade ingen prövning som stämmer.${suffix} ` +
      'Prova en angränsande kommun eller ett bredare ämne.'
    );
  }

  const count = n === 1 ? '1 prövning' : `${n} prövningar`;
  const order = n > 8 ? ' — de närmaste deadlinesen först' : '';
  const head = `Jag läste frågan som ${reading}. ${count} stämmer${order}.${suffix}`;

  return result.widened
    ? `${head} Ingen av dem hinner före din gräns eller är öppen för anmälan just nu, så här är hela träfflistan i stället.`
    : head;
}

/** A finished turn, answered out of the dataset, ready for the model to re-phrase. */
export function makeTurn(question: string, result: AskResult, id = `t${Date.now()}`): AiTurn {
  return {
    id,
    question,
    answer: localAnswer(result),
    fromModel: false,
    matches: result.matches,
    widened: result.widened,
    understood: hasConstraints(result.ask),
    carried: result.carried,
    ask: result.ask,
  };
}

/**
 * Follow-ups worth offering under the newest answer.
 *
 * A conversation is only as discoverable as its second message. Nothing on the
 * old tab suggested that "visa bara de i Göteborg" was a thing you could say,
 * so nobody said it, and the feature was a search box that kept a transcript.
 *
 * Two of the three only pay off when a model is configured to read them, so
 * they are offered only then. Suggesting "vad kostar de?" to a build that
 * answers out of the dataset alone would promise a paragraph the app cannot
 * write — the price is on the cards, and the cards are already there.
 */
export function followUpSuggestions(turn: AiTurn, withModel: boolean): string[] {
  if (!turn.understood || turn.matches.length === 0) return [];
  const suggestions: string[] = [];

  const placeNamed = turn.ask.cities.length > 0 || turn.ask.regions.length > 0;
  if (!placeNamed) {
    const cities = [...new Set(turn.matches.map((e) => e.city))];
    if (cities.length > 1) suggestions.push(`Visa bara de i ${commonest(turn.matches)}`);
  }

  if (withModel) {
    if (turn.matches.length > 1) suggestions.push('Vilken har närmast deadline?');
    suggestions.push('Vad kostar de?');
  }

  return suggestions;
}

/** The city most of these listings are in — the narrowing that removes the most rows. */
function commonest(matches: Exam[]): string {
  const counts = new Map<string, number>();
  for (const exam of matches) counts.set(exam.city, (counts.get(exam.city) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv'))[0][0];
}

/**
 * The exchanges worth replaying to the model, oldest first.
 *
 * A turn the app could not read is left out: its answer is the app asking for a
 * kurs and an ort, which tells the model nothing about the errand and reads, in
 * a transcript, like the assistant having refused.
 */
export function historyFor(thread: AiTurn[]): { question: string; answer: string }[] {
  return thread
    .filter((turn) => turn.understood)
    .map((turn) => ({ question: turn.question, answer: turn.answer }));
}
