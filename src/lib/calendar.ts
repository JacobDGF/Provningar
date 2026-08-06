import { Exam } from '../types';

/**
 * Calendar (.ics) export for a prövning's application deadline.
 *
 * Deliberately client-side and dependency-free: the reminder that actually
 * matters — "anmälan stänger om två dagar" — lands in the calendar the student
 * already checks, with no account, no backend and no push infrastructure.
 */

/** Escape a value for an iCalendar TEXT property (RFC 5545 §3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to 75 octets, continuation lines starting with a space (RFC 5545 §3.1). */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let chunk = '';
  let chunkBytes = 0;
  // Walk by code point so a fold never splits a multi-byte character.
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    // Continuation lines carry a leading space, so their budget is 74.
    if (chunkBytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(chunk);
      chunk = '';
      chunkBytes = 0;
    }
    chunk += ch;
    chunkBytes += size;
  }
  if (chunk) out.push(chunk);
  return out.join('\r\n ');
}

/** 'YYYY-MM-DD' → 'YYYYMMDD' for a DATE-valued property. */
function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/** The day after `dateStr`, since DTEND on an all-day event is exclusive. */
function dayAfter(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10).replace(/-/g, '');
}

function toIcsTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Build an iCalendar document for `exam`: one all-day event on the application
 * deadline (with 7-day and 2-day alarms) and, when known, one for the start of
 * the exam period. Returns null when the listing has no confirmed dates to
 * export — the UI must not offer a reminder it can't honestly fill in.
 */
export function buildExamIcs(exam: Exam, now: number = Date.now()): string | null {
  const { nextPeriod } = exam;
  if (!nextPeriod.confirmed) return null;

  const stamp = toIcsTimestamp(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Provningar//Provningar//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const where = escapeText(`${exam.schoolName}, ${exam.city}`);

  if (nextPeriod.applicationEnd) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${exam.id}-anmalan@provningar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(nextPeriod.applicationEnd)}`,
      `DTEND;VALUE=DATE:${dayAfter(nextPeriod.applicationEnd)}`,
      `SUMMARY:${escapeText(`Sista anmälningsdag – ${exam.course}`)}`,
      `LOCATION:${where}`,
      `DESCRIPTION:${escapeText(
        `Sista dagen att anmäla dig till prövning i ${exam.course} hos ${exam.schoolName} (${exam.provider}).\n\n` +
          `Avgift: ${exam.price} kr.\n` +
          `Anmälan: ${exam.registrationUrl}\n\n` +
          'Kontrollera alltid datumet hos anordnaren — det är deras uppgifter som gäller.'
      )}`,
      `URL:${exam.registrationUrl}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P7D',
      `DESCRIPTION:${escapeText(`En vecka kvar att anmäla dig till ${exam.course}`)}`,
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P2D',
      `DESCRIPTION:${escapeText(`Två dagar kvar att anmäla dig till ${exam.course}`)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  if (nextPeriod.examWindowStart) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${exam.id}-provning@provningar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(nextPeriod.examWindowStart)}`,
      `DTEND;VALUE=DATE:${dayAfter(nextPeriod.examWindowEnd || nextPeriod.examWindowStart)}`,
      `SUMMARY:${escapeText(`Prövning – ${exam.course}`)}`,
      `LOCATION:${where}`,
      `DESCRIPTION:${escapeText(
        `Provperiod för ${exam.course} hos ${exam.schoolName}.\n\n` +
          `Exakt tid och sal meddelas i kallelsen från anordnaren.\n${exam.infoUrl}`
      )}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  // Nothing but the envelope means there was no date worth exporting.
  if (!lines.some(l => l === 'BEGIN:VEVENT')) return null;

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** A filesystem-safe filename for the exported reminder. */
export function icsFilename(exam: Exam): string {
  const slug = `${exam.course}-${exam.schoolName}`
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `provning-${slug || exam.id}.ics`;
}

/** Trigger a download of the exam's .ics reminder. No-op when there's nothing to export. */
export function downloadExamIcs(exam: Exam): boolean {
  const ics = buildExamIcs(exam);
  if (!ics) return false;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFilename(exam);
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next frame so Safari has committed the navigation first.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
