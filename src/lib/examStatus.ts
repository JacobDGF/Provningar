import { Exam } from '../types';

/** Whether an exam's application window is open right now, computed live
    against today's date. Only ever true for exams with confirmed, real
    dates — never guessed.

    Some providers only publish a closing date ("anmälan stänger 11 augusti")
    and never say when the window opened. That is still enough to know the
    booking is open today, so an end date on its own counts. */
export function isOpenForRegistration(exam: Exam): boolean {
  const { nextPeriod } = exam;
  if (!nextPeriod.confirmed || !nextPeriod.applicationEnd) return false;
  const now = Date.now();
  if (now > endOfDay(nextPeriod.applicationEnd)) return false;
  return !nextPeriod.applicationStart || now >= new Date(nextPeriod.applicationStart).getTime();
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
