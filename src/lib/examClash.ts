import { Exam } from '../types';

/**
 * Två prövningar samma dag.
 *
 * En prövningsperiod är en månad, men ett skrivpass är en eftermiddag. De
 * anordnare som publicerar ett skrivschema — Komvux Malmö skriver ut varje
 * kurs, dag och incheckningstid, Prövningsenheten Göteborg daterar varje kurs
 * till en enda kväll — låser därmed kursen till en bestämd dag inne i perioden.
 * Två sparade prövningar kan alltså ha överlappande perioder, se helt
 * oproblematiska ut på varsitt kort, och ändå vara omöjliga att göra båda två.
 *
 * Det är en krock användaren behöver se *innan* hen betalar. Malmö tar inte ens
 * emot anmälan ("du får skriva högst ett kursprov per dag ... om kurserna
 * krockar kan vi inte behandla din ansökan"), och en avgift som är betald
 * flyttas inte till nästa period. Ingenting annat i appen kunde upptäcka det:
 * dagen stod i löptext, och löptext går inte att jämföra.
 *
 * Regeln här är den fysiska, inte anordnarens: samma dag betyder att du bara
 * hinner skriva det ena, oavsett vem som håller i provet.
 */

/**
 * The days this round actually puts the user in a room, as ISO dates.
 *
 * Two shapes in the dataset say the same thing, and both are read here: a
 * published skrivschema (`writingDays`), and a window that is a single day —
 * which is how a provider who dates each course to one evening is stored.
 * A month-long window says nothing about which day, and yields nothing.
 */
export function writingDaysOf(exam: Exam): string[] {
  const p = exam.nextPeriod;
  if (!p.confirmed) return [];
  if (p.writingDays?.length) return [...p.writingDays];
  if (p.examWindowStart && p.examWindowStart === p.examWindowEnd) return [p.examWindowStart];
  return [];
}

export interface Clash {
  /** The day both rounds are written, ISO. */
  date: string;
  /** The colliding listings, in the order they were given. */
  exams: Exam[];
  /** True when every colliding round is at the same school — the case where the
      provider itself refuses the anmälan, not just the calendar. */
  sameSchool: boolean;
}

/**
 * Clashes among the saved rounds, soonest first.
 *
 * `today` is passed in rather than read off the clock: a day that has already
 * been and gone is not a decision anybody can still make, and a view that
 * answers "as of" some other date must weigh it against the same one.
 */
export function findClashes(exams: Exam[], today: string = todayIso()): Clash[] {
  const byDate = new Map<string, Exam[]>();

  for (const exam of exams) {
    for (const day of writingDaysOf(exam)) {
      if (day < today) continue;
      const on = byDate.get(day) ?? [];
      // The same listing saved twice is not a clash with itself.
      if (on.some((e) => e.id === exam.id)) continue;
      on.push(exam);
      byDate.set(day, on);
    }
  }

  return [...byDate.entries()]
    .filter(([, on]) => on.length > 1)
    .map(([date, on]) => ({
      date,
      exams: on,
      sameSchool: on.every((e) => e.schoolName === on[0].schoolName),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}
