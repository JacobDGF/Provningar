import { Exam } from '../types';
import {
  StatusKey,
  STATUS_ORDER,
  STATUS_TONES,
  StatusTone,
  countByStatus,
} from './examStatusColor';

/**
 * "Läget för dina sparade" — the one question the profile answers first.
 *
 * A saved list is five dates to hold in your head. What the user actually wants
 * to know is narrower: of the rounds I saved, how many can I still act on? So
 * the profile shows the saved exams as a single bar in the status colours, and
 * this derives that bar — the non-empty buckets, in the legend's order, and the
 * count of rounds you can still book.
 *
 * "Still bookable" is the green, amber, and blue buckets: open today, closing
 * this week, or dated and about to open. Red (full) and grey (closed) are the
 * rounds the saved list can only remind you that you missed; undated ones send
 * you to the school rather than to a booking, so they don't count as bookable
 * either.
 */
const ACTIONABLE: ReadonlySet<StatusKey> = new Set<StatusKey>(['open', 'closing', 'upcoming']);

export interface SavedStatusBucket {
  tone: StatusTone;
  count: number;
}

export interface SavedStatusSummary {
  total: number;
  /** How many saved rounds you can still book (green + amber + blue). */
  actionable: number;
  /** Every non-empty bucket, in legend order, for the bar and the rows. */
  buckets: SavedStatusBucket[];
}

export function summarizeSavedStatus(exams: Exam[]): SavedStatusSummary {
  const counts = countByStatus(exams);
  const buckets: SavedStatusBucket[] = STATUS_ORDER.filter((k) => counts[k] > 0).map((k) => ({
    tone: STATUS_TONES[k],
    count: counts[k],
  }));
  const actionable = STATUS_ORDER.filter((k) => ACTIONABLE.has(k)).reduce(
    (sum, k) => sum + counts[k],
    0,
  );
  return { total: exams.length, actionable, buckets };
}
