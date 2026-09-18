import { Exam } from '../types';
import {
  compareByPeriod,
  hasApplicationClosed,
  isFullyBooked,
  isOpenForRegistration,
} from './examStatus';
import { courseCounterpart } from './courseSystems';

/**
 * Samma kurs, någon annanstans — vad en stängd listning har kvar att erbjuda.
 *
 * Sex av tio listningar i datan är stängda vilken dag som helst: anmälan tog
 * slut i förrgår, eller anordnaren har skrivit att platserna är slut. Appen har
 * hittills svarat det som är sant men oanvändbart — "stängde 11 sep" och en
 * länk till anordnarens egen sida, där nästa omgång kanske annonseras om tre
 * månader. `hasApplicationClosed` säger det rakt ut i sin egen kommentar: det
 * enda som är värt något då är att leta efter nästa prövning.
 *
 * Nästa prövning behöver inte vara nästa termin. Flera anordnare tar emot vem
 * som helst — Linköping skriver ut att du inte behöver bo i kommunen — så en
 * kurs som stängde i Helsingborg kan vara öppen i Göteborg i tre veckor till.
 * Det är hela funktionen: en stängd listning pekar på de listningar som prövar
 * *samma kurs* och fortfarande tar emot anmälningar.
 *
 * Alla tar dock inte emot alla. Umevux prövar för folkbokförda i Västerbotten,
 * Södertälje för fem kommuner, ABF Stockholm tvärtom bara för den som bor
 * utanför staden. Villkoret står i varje listnings egen beskrivning och finns
 * inte som ett fält att filtrera på, så förslaget lovar ingen plats: det säger
 * var kursen är öppen, och raden leder in i listningen där villkoret står.
 *
 * Tre regler håller svaret ärligt:
 *
 * - **Samma kurs, inte samma ämne.** Matchningen går på kurskod, aldrig på
 *   ämne eller på namnlikhet. "Matematik 2b" och "Matematik 3b" är två kurser
 *   med två prov, och att föreslå den ena för den andra vore att skicka någon
 *   till fel sal. Gy25-ämnesnivån räknas som samma kurs som sin Gy11-kurs, men
 *   bara när `courseSystems` har paret skrivet ur en källa.
 * - **Bara kurskoder som betyder en kurs.** En tredjedel av datan listar
 *   "Flera kurser (kontakta skolan för kurskod)" med koden `Varierar`. Två
 *   sådana listningar har inte samma kurs gemensamt, de har ingen kurs alls.
 * - **Bara det som går att söka till i dag.** Ett förslag som självt är stängt
 *   är samma återvändsgränd en gång till.
 */

/** Koder som betyder en bestämd kurs. `Varierar` och liknande gör det inte. */
function isSpecificCourseCode(code: string): boolean {
  const trimmed = code.trim();
  return /\d/.test(trimmed) && !/\s/.test(trimmed);
}

/** Kurskoderna som räknas som samma kurs som den här listningens. */
function sameCourseCodes(exam: Exam): string[] {
  if (!isSpecificCourseCode(exam.courseCode)) return [];
  const codes = [exam.courseCode.trim().toLowerCase()];
  const counterpart = courseCounterpart(exam.courseCode);
  if (counterpart) codes.push(counterpart.other.code.trim().toLowerCase());
  return codes;
}

/**
 * True när listningen är en återvändsgränd: anmälan har stängt, eller
 * anordnaren har sagt att omgången är full.
 *
 * En odaterad listning räknas inte hit. Den är inte stängd — den är okänd, och
 * där är anordnarens egen sida fortfarande det rätta svaret.
 */
export function isBlocked(exam: Exam, now: Date = new Date()): boolean {
  return isFullyBooked(exam) || hasApplicationClosed(exam, now);
}

export interface AlternativesOptions {
  /** Hur många förslag som mest. Tre räcker för att välja mellan. */
  limit?: number;
}

/**
 * De öppna prövningarna i samma kurs som `exam`, närmast deadline först.
 *
 * Tom lista när listningen inte är stängd, när kurskoden inte betyder en
 * bestämd kurs, och när ingen annan anordnare prövar kursen just nu. Tystnad är
 * rätt svar i alla tre fallen: ett tomt "andra orter"-block som alltid står där
 * lovar en utväg som inte finns.
 */
export function openAlternatives(
  exam: Exam,
  all: Exam[],
  { limit = 3 }: AlternativesOptions = {},
): Exam[] {
  if (!isBlocked(exam)) return [];

  const codes = new Set(sameCourseCodes(exam));
  if (codes.size === 0) return [];

  const matches = all.filter(
    (other) =>
      other.id !== exam.id &&
      codes.has(other.courseCode.trim().toLowerCase()) &&
      isOpenForRegistration(other),
  );

  // Samma skola kan bära samma kurs under två koder (Gy11 och Gy25). Två rader
  // med samma skolnamn läser som två utvägar där det bara finns en.
  const seen = new Set<string>();
  const unique: Exam[] = [];
  for (const candidate of [...matches].sort(compareByPeriod)) {
    const key = `${candidate.schoolName}|${candidate.city}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
    if (unique.length === limit) break;
  }
  return unique;
}
