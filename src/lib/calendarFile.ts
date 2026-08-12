import { Exam } from '../types';

/**
 * "Lägg till i kalendern" — the deadline, in the calendar the user actually
 * checks.
 *
 * Every prövning in here is gated by a date somebody else set, and missing it
 * costs a whole term. Saving a listing in this app only helps if the app is
 * open; an .ics dropped into the phone's own calendar keeps working when it
 * isn't. It is a plain text format, so this needs no dependency and no network:
 * we build the file, hand it to the browser as a download, and the OS opens it
 * with whatever calendar the user already uses.
 *
 * All-day events (VALUE=DATE) rather than timed ones: providers publish "sista
 * anmälningsdag 11 september", not a clock time, and inventing 09:00 would put
 * a reminder at an hour nobody promised.
 */

/** Text fields have to escape `\ ; ,` and newlines — RFC 5545 §3.3.11. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** `2026-09-11` → `20260911`. */
function toIcsDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** DTEND on an all-day event is exclusive, so a one-day event ends the day
    after — otherwise calendars draw it as zero-length and some hide it. */
function dayAfter(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return toIcsDate(d.toISOString().slice(0, 10));
}

/**
 * Lines must be ≤75 octets, folded with CRLF + one leading space. Swedish text
 * is full of multi-byte characters, so this counts bytes rather than
 * characters — folding at 75 *characters* can split a byte sequence in two and
 * corrupt every å, ä and ö after the break.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = '';
  let currentBytes = 0;
  // First line gets 75 octets, continuations 74 — the leading space costs one.
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (currentBytes + size > limit) {
      out.push(current);
      current = '';
      currentBytes = 0;
      limit = 74;
    }
    current += char;
    currentBytes += size;
  }
  if (current) out.push(current);
  return out.join('\r\n ');
}

export interface CalendarEventInput {
  uid: string;
  summary: string;
  description: string;
  location: string;
  /** Inclusive first day, ISO `YYYY-MM-DD`. */
  start: string;
  /** Inclusive last day. Omit for a single-day event. */
  end?: string;
  url?: string;
}

function toVEvent(event: CalendarEventInput, stamp: string): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.start)}`,
    `DTEND;VALUE=DATE:${dayAfter(event.end ?? event.start)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
  ];
  if (event.url) lines.push(`URL:${escapeText(event.url)}`);
  // A day's notice is the useful reminder for a deadline you act on online.
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.summary)}`,
    'END:VALARM',
    'END:VEVENT',
  );
  return lines;
}

/** Wraps events in a VCALENDAR. `stamp` is injectable so tests aren't racing
    the clock. */
export function buildCalendar(events: CalendarEventInput[], stamp = nowStamp()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prövningar//Hitta prövningar//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap((e) => toVEvent(e, stamp)),
    'END:VCALENDAR',
  ];
  // CRLF between lines is not stylistic — Outlook rejects LF-only files.
  return lines.map(fold).join('\r\n') + '\r\n';
}

function nowStamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * The events worth putting in a calendar for one listing: the application
 * deadline and the exam window, each only when the provider has confirmed it.
 * An unconfirmed period produces nothing — a guessed date in someone's calendar
 * is worse than an empty one.
 */
export function examCalendarEvents(exam: Exam): CalendarEventInput[] {
  const { nextPeriod: p } = exam;
  if (!p.confirmed) return [];

  const where = `${exam.schoolName}, ${exam.address}`;
  const events: CalendarEventInput[] = [];

  if (p.applicationEnd) {
    events.push({
      uid: `${exam.id}-deadline@provningar`,
      summary: `Sista anmälningsdag: ${exam.course}`,
      description: `Anmälan till prövning i ${exam.course} hos ${exam.schoolName} (${exam.provider}) stänger idag. ${p.label}`,
      location: where,
      start: p.applicationEnd,
      url: exam.registrationUrl,
    });
  }

  if (p.examWindowStart) {
    events.push({
      uid: `${exam.id}-exam@provningar`,
      summary: `Prövning: ${exam.course}`,
      description: `Prövning i ${exam.course} hos ${exam.schoolName} (${exam.provider}). ${p.label}`,
      location: where,
      start: p.examWindowStart,
      end: p.examWindowEnd ?? p.examWindowStart,
      url: exam.infoUrl,
    });
  }

  return events;
}

/** Filename-safe slug of a course name: `Matematik 3c` → `matematik-3c`. */
function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'provning'
  );
}

export function calendarFileName(exam: Exam): string {
  return `provning-${slug(exam.course)}.ics`;
}

/** Hands the file to the browser as a download. Separated from `buildCalendar`
    so the format itself stays testable without a DOM. */
export function downloadCalendar(exam: Exam): boolean {
  const events = examCalendarEvents(exam);
  if (!events.length) return false;

  const blob = new Blob([buildCalendar(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = calendarFileName(exam);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari needs the URL alive until the click has been handled.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
