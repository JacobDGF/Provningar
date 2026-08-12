import { describe, it, expect } from 'vitest';
import {
  buildCalendar,
  examCalendarEvents,
  calendarFileName,
  CalendarEventInput,
} from './calendarFile';
import { EXAMS } from '../data/exams';
import { Exam, NextPeriod } from '../types';

const STAMP = '20260812T120000Z';

function event(overrides: Partial<CalendarEventInput> = {}): CalendarEventInput {
  return {
    uid: 'test@provningar',
    summary: 'Sista anmälningsdag',
    description: 'Beskrivning',
    location: 'Skolan, Gatan 1',
    start: '2026-09-11',
    ...overrides,
  };
}

function examWith(nextPeriod: NextPeriod): Exam {
  return {
    id: 'test-exam',
    schoolName: 'Testskolan',
    provider: 'Testkommun',
    course: 'Matematik 3c',
    address: 'Gatan 1',
    registrationUrl: 'https://example.se/anmalan',
    infoUrl: 'https://example.se/info',
    nextPeriod,
  } as Exam;
}

describe('buildCalendar', () => {
  it('wraps events in a parseable VCALENDAR', () => {
    const ics = buildCalendar([event()], STAMP);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('uses CRLF line endings, which Outlook requires', () => {
    const ics = buildCalendar([event()], STAMP);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it('ends an all-day event the day after, since DTEND is exclusive', () => {
    const ics = buildCalendar([event({ start: '2026-09-11' })], STAMP);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260911');
    expect(ics).toContain('DTEND;VALUE=DATE:20260912');
  });

  it('handles a multi-day window, including across a month boundary', () => {
    const ics = buildCalendar([event({ start: '2026-10-30', end: '2026-10-31' })], STAMP);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261030');
    expect(ics).toContain('DTEND;VALUE=DATE:20261101');
  });

  it('escapes commas, semicolons and newlines in text fields', () => {
    const ics = buildCalendar(
      [event({ summary: 'Prövning: matte, fysik; kemi', description: 'Rad 1\nRad 2' })],
      STAMP,
    );
    expect(ics).toContain('SUMMARY:Prövning: matte\\, fysik\\; kemi');
    expect(ics).toContain('DESCRIPTION:Rad 1\\nRad 2');
  });

  it('carries a one-day-ahead reminder', () => {
    const ics = buildCalendar([event()], STAMP);
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-P1D');
  });

  it('folds long lines and never splits a multi-byte character', () => {
    const long = 'Prövning i svenska som andraspråk på Åsö vuxengymnasium — '.repeat(4);
    const ics = buildCalendar([event({ description: long })], STAMP);

    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(76);
    }
    // Unfolding (CRLF + one space) has to give the escaped text back intact.
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(`DESCRIPTION:${long.replace(/,/g, '\\,')}`);
  });
});

describe('examCalendarEvents', () => {
  it('produces nothing for an unconfirmed period — no guessed dates', () => {
    expect(examCalendarEvents(examWith({ label: 'Se skolans sida', confirmed: false }))).toEqual(
      [],
    );
  });

  it('produces a deadline event and an exam event when both are known', () => {
    const events = examCalendarEvents(
      examWith({
        label: 'Anmälan 17/8–11/9, prövning 7–8 oktober',
        applicationStart: '2026-08-17',
        applicationEnd: '2026-09-11',
        examWindowStart: '2026-10-07',
        examWindowEnd: '2026-10-08',
        confirmed: true,
      }),
    );
    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe('Sista anmälningsdag: Matematik 3c');
    expect(events[0].start).toBe('2026-09-11');
    expect(events[0].url).toBe('https://example.se/anmalan');
    expect(events[1].summary).toBe('Prövning: Matematik 3c');
    expect(events[1].start).toBe('2026-10-07');
    expect(events[1].end).toBe('2026-10-08');
  });

  it('skips the half that is missing', () => {
    const onlyDeadline = examCalendarEvents(
      examWith({ label: '', applicationEnd: '2026-09-01', confirmed: true }),
    );
    expect(onlyDeadline).toHaveLength(1);
    expect(onlyDeadline[0].summary).toContain('Sista anmälningsdag');

    const onlyExam = examCalendarEvents(
      examWith({ label: '', examWindowStart: '2026-10-07', confirmed: true }),
    );
    expect(onlyExam).toHaveLength(1);
    expect(onlyExam[0].summary).toContain('Prövning');
    expect(onlyExam[0].end).toBe('2026-10-07');
  });

  it('gives every event a UID unique to the listing', () => {
    const uids = EXAMS.flatMap(examCalendarEvents).map((e) => e.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });
});

describe('the real dataset', () => {
  it('builds a valid file for every listing that has confirmed dates', () => {
    const withDates = EXAMS.filter((e) => examCalendarEvents(e).length > 0);
    expect(withDates.length).toBeGreaterThan(20);

    for (const exam of withDates) {
      const ics = buildCalendar(examCalendarEvents(exam), STAMP);
      expect(ics).toContain('BEGIN:VEVENT');
      // Every line either fits, or was folded — nothing over the limit escapes.
      for (const line of ics.split('\r\n')) {
        expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(76);
      }
    }
  });

  it('names the file after the course, safely', () => {
    for (const exam of EXAMS) {
      const name = calendarFileName(exam);
      expect(name).toMatch(/^provning-[a-z0-9-]+\.ics$/);
    }
  });
});
