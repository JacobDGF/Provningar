import { describe, it, expect } from 'vitest';
import { Exam } from '../types';
import { buildExamIcs, icsFilename } from './calendar';

const BASE: Exam = {
  id: 'malmo-eng6',
  schoolName: 'Komvux Malmö',
  provider: 'Malmö stad',
  course: 'Engelska 6',
  city: 'Malmö',
  price: 500,
  registrationUrl: 'https://example.se/anmalan',
  infoUrl: 'https://example.se/info',
  nextPeriod: {
    label: '',
    confirmed: true,
    applicationStart: '2026-09-01',
    applicationEnd: '2026-09-20',
    examWindowStart: '2026-10-05',
    examWindowEnd: '2026-10-09',
  },
} as Exam;

const NOW = Date.UTC(2026, 8, 15, 8, 30, 0);

describe('buildExamIcs', () => {
  it('emits a well-formed calendar with CRLF line endings', () => {
    const ics = buildExamIcs(BASE, NOW)!;
    expect(ics).toBeTruthy();
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('VERSION:2.0');
    // Every line break is a CRLF, never a bare LF.
    expect(/[^\r]\n/.test(ics)).toBe(false);
  });

  it('makes the application deadline an all-day event with an exclusive DTEND', () => {
    const ics = buildExamIcs(BASE, NOW)!;
    expect(ics).toContain('DTSTART;VALUE=DATE:20260920');
    expect(ics).toContain('DTEND;VALUE=DATE:20260921');
    expect(ics).toContain('UID:malmo-eng6-anmalan@provningar');
  });

  it('adds both reminder alarms ahead of the deadline', () => {
    const ics = buildExamIcs(BASE, NOW)!;
    expect(ics).toContain('TRIGGER:-P7D');
    expect(ics).toContain('TRIGGER:-P2D');
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });

  it('includes the exam period as a second event spanning to its last day', () => {
    const ics = buildExamIcs(BASE, NOW)!;
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261005');
    expect(ics).toContain('DTEND;VALUE=DATE:20261010');
  });

  it('rolls a month boundary correctly when computing DTEND', () => {
    const exam = {
      ...BASE,
      nextPeriod: { label: '', confirmed: true, applicationEnd: '2026-09-30' },
    } as Exam;
    expect(buildExamIcs(exam, NOW)).toContain('DTEND;VALUE=DATE:20261001');
  });

  it('escapes characters that are structural in iCalendar TEXT values', () => {
    const exam = {
      ...BASE,
      course: 'Matematik 3b; 3c, kort',
      schoolName: 'Skolan, Malmö',
    } as Exam;
    const ics = buildExamIcs(exam, NOW)!;
    expect(ics).toContain('Matematik 3b\\; 3c\\, kort');
    expect(ics).toContain('Skolan\\, Malmö');
  });

  it('folds content lines to 75 octets without splitting a character', () => {
    const exam = { ...BASE, description: 'x'.repeat(400) } as Exam;
    const ics = buildExamIcs(exam, NOW)!;
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('refuses to invent a reminder for unconfirmed dates', () => {
    const exam = { ...BASE, nextPeriod: { label: 'Preliminärt', confirmed: false } } as Exam;
    expect(buildExamIcs(exam, NOW)).toBeNull();
  });

  it('returns null when confirmed but there is no date to export', () => {
    const exam = { ...BASE, nextPeriod: { label: 'Öppen', confirmed: true } } as Exam;
    expect(buildExamIcs(exam, NOW)).toBeNull();
  });
});

describe('icsFilename', () => {
  it('transliterates Swedish characters into a safe filename', () => {
    expect(icsFilename(BASE)).toBe('provning-engelska-6-komvux-malmo.ics');
  });

  it('falls back to the id when the slug would be empty', () => {
    const exam = { ...BASE, course: '—', schoolName: '—' } as Exam;
    expect(icsFilename(exam)).toBe('provning-malmo-eng6.ics');
  });
});
