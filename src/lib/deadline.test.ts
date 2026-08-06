import { describe, it, expect } from 'vitest';
import { Exam } from '../types';
import { calendarDaysUntil, getDeadlineInfo, isOpenForRegistration, closingSoon } from './deadline';

/** A minimal exam with only the fields the deadline logic reads. */
function makeExam(nextPeriod: Exam['nextPeriod'], id = 'x'): Exam {
  return { id, nextPeriod } as Exam;
}

/** 2026-09-15, 10:00 local — a fixed "now" so these tests never depend on the clock. */
const NOW = new Date(2026, 8, 15, 10, 0, 0).getTime();

describe('calendarDaysUntil', () => {
  it('counts today as 0 regardless of the time of day', () => {
    expect(calendarDaysUntil('2026-09-15', NOW)).toBe(0);
    expect(calendarDaysUntil('2026-09-15', new Date(2026, 8, 15, 23, 59).getTime())).toBe(0);
  });

  it('counts forwards and backwards in whole days', () => {
    expect(calendarDaysUntil('2026-09-16', NOW)).toBe(1);
    expect(calendarDaysUntil('2026-09-22', NOW)).toBe(7);
    expect(calendarDaysUntil('2026-09-14', NOW)).toBe(-1);
  });

  it('returns null for input that is not a YYYY-MM-DD date', () => {
    expect(calendarDaysUntil('', NOW)).toBeNull();
    expect(calendarDaysUntil('september 2026', NOW)).toBeNull();
  });
});

describe('getDeadlineInfo', () => {
  it('keeps a window open through the whole of its final day', () => {
    // The regression this guards: comparing against new Date('2026-09-15'),
    // which is UTC midnight, marked a same-day deadline as already closed.
    const exam = makeExam({
      label: '',
      confirmed: true,
      applicationStart: '2026-09-01',
      applicationEnd: '2026-09-15',
    });
    const info = getDeadlineInfo(exam, NOW);
    expect(info.open).toBe(true);
    expect(info.daysLeft).toBe(0);
    expect(info.urgency).toBe('critical');
    expect(info.label).toBe('Sista dagen');
  });

  it('treats the day after the deadline as closed', () => {
    const exam = makeExam({
      label: '',
      confirmed: true,
      applicationStart: '2026-09-01',
      applicationEnd: '2026-09-14',
    });
    expect(getDeadlineInfo(exam, NOW).open).toBe(false);
    expect(getDeadlineInfo(exam, NOW).urgency).toBe('none');
  });

  it('grades urgency by how many days are left', () => {
    const at = (end: string) =>
      getDeadlineInfo(
        makeExam({ label: '', confirmed: true, applicationStart: '2026-09-01', applicationEnd: end }),
        NOW
      );
    expect(at('2026-09-16').urgency).toBe('critical'); // tomorrow
    expect(at('2026-09-17').urgency).toBe('soon'); // 2 days
    expect(at('2026-09-22').urgency).toBe('soon'); // 7 days
    expect(at('2026-09-23').urgency).toBe('open'); // 8 days
  });

  it('reports a window that has not opened yet as upcoming, not open', () => {
    const exam = makeExam({
      label: '',
      confirmed: true,
      applicationStart: '2026-09-18',
      applicationEnd: '2026-10-01',
    });
    const info = getDeadlineInfo(exam, NOW);
    expect(info.open).toBe(false);
    expect(info.urgency).toBe('upcoming');
    expect(info.daysToOpen).toBe(3);
  });

  it('never invents a status for unconfirmed dates', () => {
    const exam = makeExam({ label: 'Preliminärt september', confirmed: false });
    const info = getDeadlineInfo(exam, NOW);
    expect(info).toMatchObject({ open: false, urgency: 'none', label: null });
    expect(isOpenForRegistration(exam, NOW)).toBe(false);
  });

  it('is not open when confirmed but missing an end date', () => {
    const exam = makeExam({ label: 'Öppen', confirmed: true, applicationStart: '2026-09-01' });
    expect(isOpenForRegistration(exam, NOW)).toBe(false);
  });
});

describe('closingSoon', () => {
  const open = (id: string, end: string) =>
    makeExam({ label: '', confirmed: true, applicationStart: '2026-09-01', applicationEnd: end }, id);

  it('returns only open windows, soonest deadline first', () => {
    const exams = [
      open('later', '2026-09-30'),
      open('closed', '2026-09-10'),
      open('today', '2026-09-15'),
      makeExam({ label: 'okänt', confirmed: false }, 'unconfirmed'),
      open('soon', '2026-09-18'),
    ];
    expect(closingSoon(exams, 10, NOW).map(e => e.id)).toEqual(['today', 'soon', 'later']);
  });

  it('respects the limit', () => {
    const exams = [open('a', '2026-09-16'), open('b', '2026-09-17'), open('c', '2026-09-18')];
    expect(closingSoon(exams, 2, NOW).map(e => e.id)).toEqual(['a', 'b']);
  });
});
