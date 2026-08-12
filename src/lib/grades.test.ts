import { describe, it, expect } from 'vitest';
import { gradePoints, summarizeGrades, gradeChipClass } from './grades';
import { CompletedExam } from '../types';

const exam = (grade?: string): CompletedExam => ({
  examId: `x-${grade ?? 'none'}-${Math.random()}`,
  schoolName: 'Eget',
  subject: 'Matematik',
  course: 'Matematik 3c',
  date: '2026-05-01',
  grade,
});

describe('gradePoints', () => {
  it('uses Skolverket meritvärde weights', () => {
    expect(gradePoints('A')).toBe(20);
    expect(gradePoints('E')).toBe(10);
    expect(gradePoints('F')).toBe(0);
  });

  it('is forgiving about case and whitespace', () => {
    expect(gradePoints(' b ')).toBe(17.5);
  });

  it('returns null for anything that is not a grade', () => {
    expect(gradePoints(undefined)).toBeNull();
    expect(gradePoints('')).toBeNull();
    expect(gradePoints('G')).toBeNull();
  });
});

describe('summarizeGrades', () => {
  it('averages only the graded prövningar', () => {
    const summary = summarizeGrades([exam('A'), exam('C'), exam(undefined)]);
    expect(summary.average).toBe(17.5);
    expect(summary.graded).toBe(2);
  });

  it('does not count an ungraded entry as a zero', () => {
    // The bug this guards: logging a prövning before the result arrives must
    // not make the user's average collapse.
    expect(summarizeGrades([exam('A'), exam(undefined)]).average).toBe(20);
  });

  it('counts F as a real zero, since it is one', () => {
    expect(summarizeGrades([exam('A'), exam('F')]).average).toBe(10);
  });

  it('counts E and above as passed', () => {
    const summary = summarizeGrades([exam('E'), exam('F'), exam('B')]);
    expect(summary.passed).toBe(2);
  });

  it('has no average to report when nothing is graded', () => {
    expect(summarizeGrades([]).average).toBeNull();
    expect(summarizeGrades([exam(undefined)]).average).toBeNull();
  });

  it('rounds to one decimal so the header stat stays short', () => {
    const summary = summarizeGrades([exam('A'), exam('B'), exam('E')]);
    expect(summary.average).toBe(15.8);
  });
});

describe('gradeChipClass', () => {
  it('separates pass, weak pass and fail', () => {
    expect(gradeChipClass('A')).toContain('trust');
    expect(gradeChipClass('E')).toContain('amber');
    expect(gradeChipClass('F')).toContain('red');
  });

  it('has a neutral chip for a missing grade', () => {
    expect(gradeChipClass(undefined)).toContain('sand');
  });
});
