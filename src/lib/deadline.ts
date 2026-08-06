import { Exam } from '../types';

/**
 * Deadline maths for prövning application windows.
 *
 * All comparisons are done in *calendar days*, not elapsed milliseconds. A
 * deadline of '2026-09-20' means "you can still apply during the 20th", so an
 * application window is open through the end of that day — treating the date
 * as a UTC-midnight instant (what `new Date('2026-09-20')` gives you) closes
 * the window a day early and hides listings that are still open.
 */

export type Urgency =
  /** Closes today or tomorrow. */
  | 'critical'
  /** Closes within a week. */
  | 'soon'
  /** Open, but with more than a week left. */
  | 'open'
  /** Confirmed dates, but the window hasn't opened yet. */
  | 'upcoming'
  /** No confirmed dates, or the window has already closed. */
  | 'none';

export interface DeadlineInfo {
  /** The application window is open right now. */
  open: boolean;
  /** Whole calendar days until the window closes. 0 = closes today. Null when unknown or already closed. */
  daysLeft: number | null;
  /** Whole calendar days until the window opens. Null unless it opens in the future. */
  daysToOpen: number | null;
  urgency: Urgency;
  /** Short Swedish countdown label for a chip, e.g. "2 dagar kvar". Null when there's nothing to count down to. */
  label: string | null;
}

/** Midnight-at-the-start-of-day for a 'YYYY-MM-DD' string, in the viewer's own timezone. */
function startOfLocalDay(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

/**
 * Whole calendar days from today to `dateStr` — 0 when it's today, 1 tomorrow,
 * -1 yesterday. Rounded, so a DST transition inside the span can't shift it.
 */
export function calendarDaysUntil(dateStr: string, now: number = Date.now()): number | null {
  const target = startOfLocalDay(dateStr);
  if (target === null) return null;
  const n = new Date(now);
  const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

function pluralDays(n: number): string {
  return n === 1 ? '1 dag' : `${n} dagar`;
}

export function getDeadlineInfo(exam: Exam, now: number = Date.now()): DeadlineInfo {
  const none: DeadlineInfo = { open: false, daysLeft: null, daysToOpen: null, urgency: 'none', label: null };

  const { nextPeriod } = exam;
  if (!nextPeriod.confirmed) return none;

  const { applicationStart, applicationEnd } = nextPeriod;
  if (!applicationEnd) return none;

  const daysLeft = calendarDaysUntil(applicationEnd, now);
  if (daysLeft === null) return none;

  // Already closed.
  if (daysLeft < 0) return none;

  // Confirmed dates, but the window hasn't opened yet.
  const daysToOpen = applicationStart ? calendarDaysUntil(applicationStart, now) : null;
  if (daysToOpen !== null && daysToOpen > 0) {
    return {
      open: false,
      daysLeft: null,
      daysToOpen,
      urgency: 'upcoming',
      label: daysToOpen === 1 ? 'Öppnar imorgon' : `Öppnar om ${pluralDays(daysToOpen)}`,
    };
  }

  const urgency: Urgency = daysLeft <= 1 ? 'critical' : daysLeft <= 7 ? 'soon' : 'open';
  const label =
    daysLeft === 0 ? 'Sista dagen' : daysLeft === 1 ? 'Sista dagen imorgon' : `${pluralDays(daysLeft)} kvar`;

  return { open: true, daysLeft, daysToOpen: null, urgency, label };
}

/** True when the application window is open today. Replaces the old millisecond comparison. */
export function isOpenForRegistration(exam: Exam, now: number = Date.now()): boolean {
  return getDeadlineInfo(exam, now).open;
}

/**
 * Exams whose application window is open, soonest deadline first — the
 * "act now or wait months" set that drives the front-page rail.
 */
export function closingSoon(exams: Exam[], limit = 12, now: number = Date.now()): Exam[] {
  return exams
    .map(exam => ({ exam, info: getDeadlineInfo(exam, now) }))
    .filter(({ info }) => info.open && info.daysLeft !== null)
    .sort((a, b) => a.info.daysLeft! - b.info.daysLeft!)
    .slice(0, limit)
    .map(({ exam }) => exam);
}
