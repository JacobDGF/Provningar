import { Exam } from '../types';
import { StatusKey, StatusTone, STATUS_TONES, getStatusKey } from './examStatusColor';

/**
 * The colour a *group* of listings gets — a region, a subject, a city.
 *
 * The filters were twenty-one identical grey chips. Picking one was the only
 * way to learn what was behind it, and for most of them the answer was "one
 * listing, and its deadline was in July". The list already answers "can I book
 * this?" in colour; the filters that lead to the list answered nothing until
 * you had used them.
 *
 * So a group borrows the colour of the best thing in it. Green on Skåne means
 * something in Skåne is bookable today — not that everything is. That is the
 * right promise for a filter: it says the click is worth making, and the list
 * behind it then says exactly which listing was the reason.
 */

/**
 * Best-first, which is not the legend's order.
 *
 * `STATUS_ORDER` runs worst-first, because a legend explains what blocks you
 * before what doesn't. A group needs the opposite question answered — what is
 * the most I can do here — and the two orders disagree about more than
 * direction. `undated` is last in the legend and beats `closed` here: "the
 * school hasn't published dates" is a page worth opening, and "you missed it by
 * three weeks" is not.
 */
export const ACTIONABILITY: StatusKey[] = [
  'open',
  'closing',
  'upcoming',
  'undated',
  'closed',
  'full',
];

const RANK = new Map(ACTIONABILITY.map((key, i) => [key, i]));

/**
 * The most actionable status among these listings, or `null` for an empty
 * group. Red therefore only ever reaches a group where every single listing is
 * fullbokat — one bookable seat is enough to keep the whole group out of it,
 * which is the same promise a single card's colour makes.
 */
export function bestStatusKey(exams: Exam[]): StatusKey | null {
  let best: StatusKey | null = null;
  for (const exam of exams) {
    const key = getStatusKey(exam);
    if (best === null || RANK.get(key)! < RANK.get(best)!) best = key;
    // Nothing outranks an open window, so stop looking.
    if (best === 'open') break;
  }
  return best;
}

export interface GroupStatus {
  /** How many listings are in the group. */
  count: number;
  /** The best status in the group, or null when the group is empty. */
  key: StatusKey | null;
  /** That status's tone, or null — saves every caller a lookup. */
  tone: StatusTone | null;
  /** How many listings are open or closing — the ones you can act on today. */
  bookable: number;
}

export function summarizeGroup(exams: Exam[]): GroupStatus {
  let bookable = 0;
  for (const exam of exams) {
    const key = getStatusKey(exam);
    if (key === 'open' || key === 'closing') bookable += 1;
  }
  const key = bestStatusKey(exams);
  return { count: exams.length, key, tone: key ? STATUS_TONES[key] : null, bookable };
}

/**
 * One summary per value of `field`, keyed by that value.
 *
 * Built in a single pass over the dataset rather than a filter per chip: the
 * region row alone would otherwise walk all 111 listings twenty-one times on
 * every minute tick.
 */
export function summarizeBy(exams: Exam[], field: 'region' | 'subject' | 'city') {
  const groups = new Map<string, Exam[]>();
  for (const exam of exams) {
    const value = exam[field];
    const bucket = groups.get(value);
    if (bucket) bucket.push(exam);
    else groups.set(value, [exam]);
  }
  const out = new Map<string, GroupStatus>();
  for (const [value, bucket] of groups) out.set(value, summarizeGroup(bucket));
  return out;
}
