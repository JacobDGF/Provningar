import { CompletedExam } from '../types';

/**
 * Swedish grade points, as Skolverket weights them for meritvärde.
 *
 * The profile shows an average because that's the number people are actually
 * chasing when they book a prövning — "will this lift my meritvärde" is the
 * whole reason the app exists. Anything ungraded is left out of the average
 * rather than counted as zero, which would punish a user for logging a
 * prövning they haven't got the result for yet.
 */
const GRADE_POINTS: Record<string, number> = {
  A: 20,
  B: 17.5,
  C: 15,
  D: 12.5,
  E: 10,
  F: 0,
};

export function gradePoints(grade: string | undefined): number | null {
  if (!grade) return null;
  const points = GRADE_POINTS[grade.trim().toUpperCase()];
  return points === undefined ? null : points;
}

export interface GradeSummary {
  /** Mean grade points across every graded prövning, or null when there are none. */
  average: number | null;
  /** How many of the logged prövningar carried a grade. */
  graded: number;
  /** Grades of E or better. */
  passed: number;
}

export function summarizeGrades(completed: CompletedExam[]): GradeSummary {
  const points = completed.map((c) => gradePoints(c.grade)).filter((p): p is number => p !== null);
  return {
    average: points.length
      ? Math.round((points.reduce((a, b) => a + b, 0) / points.length) * 10) / 10
      : null,
    graded: points.length,
    passed: points.filter((p) => p >= 10).length,
  };
}

/** Tailwind classes for a grade chip. Keeps the color logic out of three components. */
export function gradeChipClass(grade: string | undefined): string {
  switch (grade?.toUpperCase()) {
    case 'A':
    case 'B':
      return 'bg-trust-50 text-trust-700';
    case 'C':
    case 'D':
      return 'bg-brand-100 text-brand-700';
    case 'E':
      return 'bg-amber-accent-50 text-amber-accent';
    case 'F':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-sand text-ink-soft';
  }
}
