import { Exam } from '../types';

/** Whether an exam's application window is open right now, computed live
    against today's date. Only ever true for exams with confirmed, real
    dates — never guessed. */
export function isOpenForRegistration(exam: Exam): boolean {
  const { nextPeriod } = exam;
  if (!nextPeriod.confirmed || !nextPeriod.applicationStart || !nextPeriod.applicationEnd)
    return false;
  const now = Date.now();
  return (
    now >= new Date(nextPeriod.applicationStart).getTime() &&
    now <= new Date(nextPeriod.applicationEnd).getTime()
  );
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
