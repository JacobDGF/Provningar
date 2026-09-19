import { Exam } from '../types';

/**
 * Två prövningar som är utsatta samma dag hos samma anordnare.
 *
 * Det här är den enda jämförelse appen kan göra åt användaren som inte handlar
 * om vilken listning som är bäst, utan om vilka två som går att välja
 * samtidigt. Komvux Malmö skriver ut den rakt ut — "du kan anmäla dig till max
 * två kurser per period, men endast skriva ett kursprov per skrivdag ... om
 * kurserna krockar kan vi inte behandla din ansökan" — och samma sak gäller
 * överallt där anordnaren satt ut dagen: ingen sitter i två prov på en gång.
 *
 * Kollisionen är osynlig i appen utan det här. Skrivdagen ligger i en mening
 * på varje listning, och två listningar läses en i taget, så den som sparar
 * Matematik 1b och Fysik 2 ser två öppna omgångar hos samma skola med samma
 * avgift och samma deadline — och får veta att de krockar först när anmälan
 * inte behandlas.
 */
export interface ExamClash {
  /** Dagen båda proven är utsatta på, i ISO-form. */
  date: string;
  /** Anordnaren, som listningarna själva skriver den. */
  schoolName: string;
  /** Listningarna som krockar, i den ordning de kom in. */
  examIds: string[];
}

/** Anordnaren som en nyckel: samma skola på samma ort är samma skrivsal. */
function providerKey(exam: Exam): string {
  return `${exam.schoolName}|${exam.city}`;
}

/**
 * Hittar de dagar där två eller fler av listningarna har ett utsatt prov hos
 * samma anordnare.
 *
 * Bara publicerade skrivpass räknas (`writtenExamDates`). En prövningsperiod
 * där läraren sätter dagen är inte en kollision — den är en dag ingen av oss
 * känner till än, och att varna för den vore att varna för en gissning.
 *
 * Kollisionen begränsas till samma anordnare med flit. Två prov samma dag i
 * Malmö och Umeå är också omöjliga att hinna med, men bara om tiderna krockar,
 * och de tiderna publicerar anordnarna var för sig. Det anordnaren själv har
 * skrivit ut är att dess egna prov ligger på ett pass per dag.
 */
export function findExamClashes(exams: Exam[]): ExamClash[] {
  const byDay = new Map<string, { date: string; schoolName: string; examIds: string[] }>();

  for (const exam of exams) {
    for (const date of exam.writtenExamDates ?? []) {
      const key = `${providerKey(exam)}|${date}`;
      const group = byDay.get(key) ?? { date, schoolName: exam.schoolName, examIds: [] };
      if (!group.examIds.includes(exam.id)) group.examIds.push(exam.id);
      byDay.set(key, group);
    }
  }

  return [...byDay.values()]
    .filter((group) => group.examIds.length > 1)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** "tisdag 27 oktober" — dagen som en dag, inte som ett datum att räkna ut. */
function weekday(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Kollisionen som en mening.
 *
 * Meningen säger vad som krockar, när, och vad användaren ska göra åt det —
 * i den ordningen, eftersom det är den ordning frågorna ställs i. Den säger
 * aldrig vilken av dem som ska väljas bort: det är hela valet, och det är
 * användarens.
 */
export function describeClash(clash: ExamClash, exams: Exam[]): string {
  const names = clash.examIds
    .map((id) => exams.find((e) => e.id === id)?.course)
    .filter((name): name is string => Boolean(name));
  if (names.length < 2) return '';

  const listed =
    names.length === 2
      ? `${names[0]} och ${names[1]}`
      : `${names.slice(0, -1).join(', ')} och ${names[names.length - 1]}`;
  const allOrBoth = names.length === 2 ? 'båda' : 'alla';

  return (
    `${listed} är ${allOrBoth} utsatta ${weekday(clash.date)} hos ${clash.schoolName}. ` +
    'Du kan bara skriva ett prov per dag.'
  );
}
