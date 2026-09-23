import { Exam } from '../types';
import { compareByPeriod, hasApplicationClosed, isFullyBooked } from './examStatus';

/**
 * Reading a sentence about a prövning, without a server.
 *
 * The app's search takes a word. What people actually arrive with is a
 * sentence — "jag bor i Göteborg och vill höja mitt betyg i Matte 2b innan
 * december" — which carries four separate constraints (stad, kurs, deadline,
 * och att omgången faktiskt går att söka till) that the search box makes you
 * enter one at a time, in four different controls, having first learned that
 * they exist.
 *
 * This turns the sentence into those constraints. It is deliberately not a
 * language model: it reads the dataset's own vocabulary — every stad, län,
 * ämne, kurs and kurskod that actually exists in `EXAMS` — out of the data it
 * is handed, so it can never offer a course nobody prövar, and it cannot invent
 * a datum or an avgift because it never writes one. The model, when the app has
 * one configured, phrases the answer; the shortlist under it is always this.
 *
 * The other half of that bargain is that the reading is shown rather than
 * assumed: the tab prints what it understood above the results, so a
 * misreading is one visible line instead of a confident paragraph.
 *
 * A question can also be read against the one before it. "Visa bara de i
 * Göteborg" carries no kurs of its own and is a perfectly clear thing to say
 * anyway, because the kurs is in the previous message — so `answerAsk` takes an
 * optional `previous` reading and fills in the axes this sentence left alone.
 * What it filled in comes back as `carried`, for the same reason the reading is
 * printed at all.
 */

export interface Ask {
  cities: string[];
  regions: string[];
  subjects: string[];
  courses: string[];
  /** ISO date the prövning must fall before, from "innan december" and friends. */
  before?: string;
}

/**
 * The three things a question can pin down.
 *
 * A follow-up is merged per axis rather than per field, because the fields
 * inside one axis are alternatives rather than additions. "Engelska" after a
 * question about Matematik 2b sets `subjects` and leaves `courses` empty — and
 * carrying the old `courses` forward would then hand the filter both an ämne
 * and a kurs that cannot both be true, which matches nothing. The axis is the
 * unit the user is actually replacing.
 */
export type AskAxis = 'ämne' | 'plats' | 'tid';

export const ASK_AXES: AskAxis[] = ['ämne', 'plats', 'tid'];

export interface AskResult {
  ask: Ask;
  matches: Exam[];
  /**
   * True when the constraints as written matched nothing and the deadline and
   * "går att söka till" parts were dropped to have something to show. The UI
   * says so — silently widening a search is how a wrong answer gets trusted.
   */
  widened: boolean;
  /**
   * Axes this reading took from the previous question instead of from this one.
   *
   * The same rule as `widened`: what the app filled in on the user's behalf is
   * printed, not assumed. "Visa bara de i Göteborg" is a useful question only
   * because the kurs came from the message before it, and a user who cannot see
   * that inheritance cannot tell a helpful answer from a stuck one.
   */
  carried: AskAxis[];
}

/** Everyday words for things the dataset spells out in full. */
const ALIASES: [RegExp, string][] = [
  [/\bmatte\b/g, 'matematik'],
  [/\bma\b/g, 'matematik'],
  [/\bsamhalls?\b/g, 'samhallskunskap'],
  [/\beng\b/g, 'engelska'],
  [/\bsva\b/g, 'svenska som andrasprak'],
  [/\bsfi\b/g, 'svenska for invandrare'],
  [/\bnk\b/g, 'naturkunskap'],
  [/\breligion\b/g, 'religionskunskap'],
  [/\bgbg\b/g, 'goteborg'],
  [/\bsthlm\b/g, 'stockholm'],
];

const MONTHS = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

/** Lowercase, de-accented, punctuation turned into spaces, padded for whole-word tests. */
function normalize(text: string): string {
  const folded = text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${folded} `;
}

function withAliases(padded: string): string {
  return ALIASES.reduce((text, [pattern, full]) => text.replace(pattern, full), padded);
}

function contains(haystack: string, term: string): boolean {
  const needle = normalize(term);
  return needle.trim() !== '' && haystack.includes(needle);
}

/**
 * The first of the named month strictly after `today`.
 *
 * "innan december" said in augusti means this december; said in december it
 * means the next one. Anchoring on today rather than on the calendar year is
 * the difference between a filter that still works in januari and one that
 * quietly returns nothing.
 */
function nextFirstOfMonth(monthIndex: number, today: Date): string {
  const year = today.getUTCFullYear();
  const thisYear = Date.UTC(year, monthIndex, 1);
  const y = thisYear > today.getTime() ? year : year + 1;
  return `${y}-${String(monthIndex + 1).padStart(2, '0')}-01`;
}

function readDeadline(padded: string, today: Date): string | undefined {
  if (!/\b(innan|fore|senast|inom)\b/.test(padded)) return undefined;
  for (let i = 0; i < MONTHS.length; i++) {
    if (padded.includes(` ${MONTHS[i]} `)) return nextFirstOfMonth(i, today);
  }
  if (padded.includes(' jul ') || padded.includes(' julen ')) return nextFirstOfMonth(11, today);
  if (padded.includes(' sommaren ')) return nextFirstOfMonth(5, today);
  if (padded.includes(' nyar ') || padded.includes(' arsskiftet ')) {
    return `${today.getUTCFullYear() + 1}-01-01`;
  }
  return undefined;
}

/** Distinct values of one field, longest first so "Matematik 2b" is tried before "Matematik". */
function vocabulary(exams: Exam[], pick: (e: Exam) => string): string[] {
  return [...new Set(exams.map(pick))].sort((a, b) => b.length - a.length);
}

/**
 * Still worth acting on: the deadline hasn't passed and the round isn't full.
 *
 * Judged as of the same `today` the sentence was read against. It used to read
 * the clock instead, which meant a question about "innan oktober" could keep a
 * round the deadline reader had already counted as open — two answers to the
 * same question inside one call, and a test pinned to a fixed date that started
 * failing on the day the real calendar disagreed with it.
 */
function stillActionable(exam: Exam, today: Date): boolean {
  return !hasApplicationClosed(exam, today) && !isFullyBooked(exam);
}

function fallsBefore(exam: Exam, cutoff: string): boolean {
  const p = exam.nextPeriod;
  if (!p.confirmed) return false;
  const when = p.examWindowStart || p.applicationEnd;
  return !!when && when < cutoff;
}

/** True when this reading pinned down anything at all on `axis`. */
function namesAxis(ask: Ask, axis: AskAxis): boolean {
  if (axis === 'ämne') return ask.subjects.length > 0 || ask.courses.length > 0;
  if (axis === 'plats') return ask.cities.length > 0 || ask.regions.length > 0;
  return ask.before !== undefined;
}

/**
 * Asking for an axis back, in so many words.
 *
 * Without these, an inherited constraint is a room with no door: once a
 * question has mentioned Göteborg, every follow-up is about Göteborg, and the
 * only way out is to start over. "Överallt" has to be able to mean överallt.
 */
const WIDENINGS: Record<AskAxis, RegExp> = {
  ämne: /\b(alla amnen|oavsett amne|alla kurser|oavsett kurs|vilken kurs som helst|vilket amne som helst)\b/,
  plats:
    /\b(overallt|var som helst|varsomhelst|hela sverige|hela landet|alla orter|alla kommuner|oavsett ort|oavsett kommun|oavsett var)\b/,
  tid: /\b(nar som helst|narsomhelst|oavsett datum|oavsett nar|oavsett tid|ingen deadline|alla datum)\b/,
};

function copyAxis(target: Ask, source: Ask, axis: AskAxis): void {
  if (axis === 'ämne') {
    target.subjects = source.subjects;
    target.courses = source.courses;
  } else if (axis === 'plats') {
    target.cities = source.cities;
    target.regions = source.regions;
  } else {
    target.before = source.before;
  }
}

export function readAsk(question: string, exams: Exam[], today = new Date(), previous?: Ask): Ask {
  return read(question, exams, today, previous).ask;
}

/**
 * The reading, plus what it had to borrow from the question before it.
 *
 * Kept private because `answerAsk` is the honest entry point: it returns
 * `carried` alongside the matches, so a caller cannot get the benefit of the
 * inheritance without also being handed the fact of it.
 */
function read(
  question: string,
  exams: Exam[],
  today: Date,
  previous?: Ask,
): { ask: Ask; carried: AskAxis[] } {
  const padded = withAliases(normalize(question));
  const matching = (terms: string[]) => terms.filter((term) => contains(padded, term));

  const courses = matching(vocabulary(exams, (e) => e.course));
  for (const code of matching(vocabulary(exams, (e) => e.courseCode))) {
    for (const exam of exams) {
      if (exam.courseCode === code && !courses.includes(exam.course)) courses.push(exam.course);
    }
  }

  const ask: Ask = {
    cities: matching(vocabulary(exams, (e) => e.city)),
    regions: matching(vocabulary(exams, (e) => e.region)),
    subjects: matching(vocabulary(exams, (e) => e.subject)),
    courses,
    before: readDeadline(padded, today),
  };

  if (!previous) return { ask, carried: [] };

  // Three ways an axis can end up unset, and only one of them is an invitation
  // to reuse the last answer's: the user said nothing about it. Saying something
  // new replaces it, and asking for it back clears it.
  const carried: AskAxis[] = [];
  for (const axis of ASK_AXES) {
    if (namesAxis(ask, axis)) continue;
    if (WIDENINGS[axis].test(padded)) continue;
    if (!namesAxis(previous, axis)) continue;
    copyAxis(ask, previous, axis);
    carried.push(axis);
  }
  return { ask, carried };
}

export function hasConstraints(ask: Ask): boolean {
  return !!(
    ask.cities.length ||
    ask.regions.length ||
    ask.subjects.length ||
    ask.courses.length ||
    ask.before
  );
}

/**
 * The listings a question asks for, most urgent first.
 *
 * The deadline and "kan fortfarande sökas" are the two constraints dropped
 * together when nothing survives them, because they are the two the user did
 * not so much choose as assume. Dropping the stad or the kurs instead would
 * answer a different question than the one asked.
 */
export function answerAsk(
  question: string,
  exams: Exam[],
  today = new Date(),
  previous?: Ask,
): AskResult {
  const { ask, carried } = read(question, exams, today, previous);

  const named = exams.filter((e) => {
    const cityOk = !ask.cities.length || ask.cities.includes(e.city);
    const regionOk = !ask.regions.length || ask.regions.includes(e.region);
    const subjectOk = !ask.subjects.length || ask.subjects.includes(e.subject);
    const courseOk = !ask.courses.length || ask.courses.includes(e.course);
    return cityOk && regionOk && subjectOk && courseOk;
  });

  const strict = named.filter(
    (e) => stillActionable(e, today) && (!ask.before || fallsBefore(e, ask.before)),
  );
  const matches = (strict.length ? strict : named).slice().sort(compareByPeriod);
  return { ask, matches, widened: strict.length === 0 && named.length > 0, carried };
}

/** One line saying what the sentence was read as, for the user to check. */
export function describeAsk(ask: Ask): string {
  const parts: string[] = [];
  if (ask.courses.length) parts.push(ask.courses.join(', '));
  else if (ask.subjects.length) parts.push(ask.subjects.join(', '));
  if (ask.cities.length) parts.push(`i ${ask.cities.join(', ')}`);
  else if (ask.regions.length) parts.push(`i ${ask.regions.join(', ')} län`);
  if (ask.before) parts.push(`före ${MONTHS[Number(ask.before.split('-')[1]) - 1]}`);
  return parts.join(' ');
}

/**
 * Just the part of a reading that sits on `axes`, worded as `describeAsk` does.
 *
 * Used for the line that names what a follow-up inherited. It goes through the
 * same formatter on purpose: "Matematik 2b" has to read identically whether it
 * is the thing you asked for or the thing you asked about.
 */
export function describeAxes(ask: Ask, axes: AskAxis[]): string {
  const empty: Ask = { cities: [], regions: [], subjects: [], courses: [] };
  for (const axis of axes) copyAxis(empty, ask, axis);
  return describeAsk(empty);
}
