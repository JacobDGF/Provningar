import { Exam } from '../types';

/**
 * Två sparade prövningar som skrivs samma dag hos samma anordnare.
 *
 * Det här är den enda konflikt appen kan se innan användaren betalar. Allt
 * annat som går fel med en anmälan upptäcker anordnaren; det här upptäcker
 * användaren själv, på plats, när två prov börjar 15.15 i samma sal.
 *
 * Komvux Malmö skriver ut regeln på sin egen sida: *"Du kan anmäla dig till max
 * två kurser/period, men endast skriva ett kursprov per skrivdag. … Om kurserna
 * krockar kan vi inte behandla din ansökan."* En krock där är alltså inte ett
 * val mellan två prov — det är en anmälan som inte behandlas alls, för 1 000
 * kronor som inte betalas tillbaka.
 */
export interface ExamClash {
  /** ISO-datumet de krockar på. */
  date: string;
  /** Anordnaren, som listningarna stavar den. */
  schoolName: string;
  city: string;
  /** Listningarna som skrivs den dagen, i den ordning de kom in. */
  exams: Exam[];
}

/** Anordnaren är skolan på orten — samma namn i två städer är två anordnare. */
function providerKey(exam: Exam): string {
  return `${exam.schoolName}|${exam.city}`;
}

/**
 * Krockarna bland de sparade prövningarna, tidigaste dagen först.
 *
 * Bara listningar som har `nextPeriod.examDays` kan krocka. En anordnare som
 * bara publicerat perioden ("26 oktober – 25 november") har inte sagt vilken
 * dag kursen skrivs, och två sådana listningar överlappar i kalendern utan att
 * det betyder någonting — att varna för dem vore att kalla varje sparad
 * höstprövning en konflikt.
 *
 * En full omgång räknas inte heller: den går inte att anmäla sig till, så den
 * kan inte krocka med något.
 */
export function findClashes(exams: Exam[]): ExamClash[] {
  const groups = new Map<string, ExamClash>();

  for (const exam of exams) {
    const period = exam.nextPeriod;
    if (!period.confirmed || period.full) continue;
    for (const date of period.examDays ?? []) {
      const key = `${providerKey(exam)}|${date}`;
      const group = groups.get(key);
      if (group) {
        // Two delprov of the same listing on one day is one prov, not a clash.
        if (!group.exams.includes(exam)) group.exams.push(exam);
      } else {
        groups.set(key, { date, schoolName: exam.schoolName, city: exam.city, exams: [exam] });
      }
    }
  }

  return [...groups.values()]
    .filter((g) => g.exams.length > 1)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** "torsdag 29 oktober" — dagen som en läsare känner igen den från schemat. */
export function clashDayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
