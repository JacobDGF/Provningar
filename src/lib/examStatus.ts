/**
 * Compatibility surface for the original status helpers. The real logic now
 * lives in ./deadline, which compares calendar days instead of millisecond
 * instants — the previous `now <= new Date(applicationEnd)` closed a window at
 * 00:00 UTC on its final day, so a listing you could still apply to today was
 * shown as closed. Re-exported here so every existing call site picks the fix
 * up unchanged.
 */
import { calendarDaysUntil } from './deadline';

export { isOpenForRegistration, getDeadlineInfo, closingSoon } from './deadline';
export type { DeadlineInfo, Urgency } from './deadline';

/** Whole calendar days until `dateStr`; 0 means today. NaN for unparseable input. */
export function daysUntil(dateStr: string): number {
  const days = calendarDaysUntil(dateStr);
  return days === null ? NaN : days;
}
