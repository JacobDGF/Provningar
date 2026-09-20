import { Exam } from '../types';
import { courseCounterpart } from './courseSystems';
import { haversineDistanceKm } from './distance';
import { isOpenForRegistration } from './examStatus';

/**
 * Var samma kurs fortfarande går att anmäla sig till.
 *
 * En listning vars anmälan har stängt är ett återvändsgränd i appen: kortet
 * säger "stängd", knappen skickar vidare till anordnarens sida, och där står
 * i bästa fall när nästa omgång publiceras. Men frågan användaren kom med var
 * aldrig "vad gör Helsingborg i vår" — den var "var kan jag pröva Matematik
 * 2b innan december", och det svaret finns redan i datan. 670 listningar på
 * ett ställe är hela poängen med appen; att inte titta i dem när den ena man
 * öppnat är stängd vore att kasta bort det.
 *
 * Tre regler håller svaret ärligt:
 *
 * - **Samma kurs, inte samma ämne.** Matchningen går på kurskod, plus kursens
 *   motsvarighet i det andra systemet när någon källa har skrivit ut paret
 *   (se `courseSystems.ts`). Ett "Matematik 3c" när du sökte Matematik 2b är
 *   inte ett alternativ, det är brus.
 * - **Bara omgångar som faktiskt går att boka.** `isOpenForRegistration` är
 *   samma villkor som färgen på kortet: bekräftade datum, inte fullbokat,
 *   och dagen ligger inne i fönstret.
 * - **Närmast först.** En prövning i en annan kommun är ett alternativ bara om
 *   man kan ta sig dit, och avståndet räknas från den listning användaren
 *   redan tittar på — inte från telefonens position, som ofta inte finns.
 * - **En rad per anordnare.** Örebro publicerar samma prövning som två
 *   anmälningar, en per system, och två rader med samma skola och samma
 *   deadline är inte två alternativ. Raden som blir kvar är den i samma system
 *   som kortet användaren står på, för det är den hen kan söka.
 *
 * Det appen *inte* kan svara på är vem som får pröva var: kommunerna har olika
 * regler, och några prövar bara sina egna invånare. Därför är listan förslag
 * att kontrollera hos anordnaren, och vyn säger det rakt ut.
 */
export interface OpenAlternative {
  exam: Exam;
  /** Fågelvägen från listningen användaren tittar på. */
  km: number;
  /** Sant när alternativet är samma kurs under det andra systemets namn. */
  otherSystem: boolean;
}

/** Hur många alternativ som är hjälp snarare än en ny lista att läsa. */
const DEFAULT_LIMIT = 3;

export function openAlternatives(
  exam: Exam,
  all: Exam[],
  limit: number = DEFAULT_LIMIT,
): OpenAlternative[] {
  const own = exam.courseCode.trim().toLowerCase();
  const other = courseCounterpart(exam.courseCode)?.other.code.trim().toLowerCase();

  const matches: OpenAlternative[] = [];
  for (const candidate of all) {
    if (candidate.id === exam.id) continue;
    const code = candidate.courseCode.trim().toLowerCase();
    if (code !== own && code !== other) continue;
    if (!isOpenForRegistration(candidate)) continue;
    matches.push({
      exam: candidate,
      km: haversineDistanceKm(exam.lat, exam.lng, candidate.lat, candidate.lng),
      otherSystem: code !== own,
    });
  }

  const perProvider = new Map<string, OpenAlternative>();
  for (const match of matches) {
    const key = `${match.exam.schoolName}|${match.exam.city}`.toLowerCase();
    const kept = perProvider.get(key);
    if (!kept || better(match, kept)) perProvider.set(key, match);
  }
  const deduped = [...perProvider.values()];

  deduped.sort((a, b) => {
    if (Math.round(a.km) !== Math.round(b.km)) return a.km - b.km;
    const deadlineA = a.exam.nextPeriod.applicationEnd ?? '';
    const deadlineB = b.exam.nextPeriod.applicationEnd ?? '';
    if (deadlineA !== deadlineB) return (deadlineA || '9999').localeCompare(deadlineB || '9999');
    return a.exam.schoolName.localeCompare(b.exam.schoolName, 'sv');
  });

  return deduped.slice(0, limit);
}

/** Vilken av två listningar hos samma anordnare som är alternativet. */
function better(a: OpenAlternative, b: OpenAlternative): boolean {
  if (a.otherSystem !== b.otherSystem) return !a.otherSystem;
  const deadlineA = a.exam.nextPeriod.applicationEnd ?? '9999';
  const deadlineB = b.exam.nextPeriod.applicationEnd ?? '9999';
  return deadlineA < deadlineB;
}
