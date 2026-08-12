import { Exam } from '../types';

/** Whether an exam's application window is open right now, computed live
    against today's date. Only ever true for exams with confirmed, real
    dates — never guessed.

    Providers publish these windows half-open in both directions: some only say
    when applications close ("anmälan stänger 11 augusti"), others only when
    they open, and never publish a closing date. Either end alone is enough to
    place today inside or outside the window, so a period counts as open when
    every end it does state has been satisfied. */
export function isOpenForRegistration(exam: Exam): boolean {
  const { nextPeriod: p } = exam;
  if (!p.confirmed) return false;
  // A full round is closed however its dates read: the provider has said so
  // outright, and that beats the calendar.
  if (p.full) return false;
  if (!p.applicationStart && !p.applicationEnd) return false;
  const now = Date.now();
  if (p.applicationStart && now < new Date(p.applicationStart).getTime()) return false;
  if (p.applicationEnd && now > endOfDay(p.applicationEnd)) return false;
  return true;
}

/** True when the provider has published this round as fully booked. Kept
    separate from `isOpenForRegistration` so the UI can say *why* it is closed —
    "fullbokat" and "inte öppnat än" send the user to different next steps. */
export function isFullyBooked(exam: Exam): boolean {
  return exam.nextPeriod.full === true;
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** A deadline of "23 augusti" means end of that day, not 00:00 that morning —
    otherwise the last day of an application window reads as already closed. */
function endOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
