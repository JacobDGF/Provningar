import { useMemo } from 'react';
import { CalendarX2 } from 'lucide-react';
import { Exam } from '../types';
import { findClashes } from '../lib/examClash';

/**
 * De sparade prövningar som är skrivna på samma dag.
 *
 * Kortet säger vilken dag det gäller och vilka två prövningar som krockar,
 * och ingenting mer. Det finns ingen knapp här: valet mellan två kurser är
 * inte appens att göra, och den som ser krocken vet redan vad den kostar —
 * anmälningsavgiften är betald i förskott och flyttas inte.
 *
 * Panelen visas bara när det finns en krock. En tom ruta som säger "inga
 * krockar" vore en varning om ingenting, varje gång.
 */
export function ClashNotice({ exams }: { exams: Exam[] }) {
  const clashes = useMemo(() => findClashes(exams), [exams]);
  if (clashes.length === 0) return null;

  return (
    <div className="bg-surface border-[1.5px] border-orange-200 rounded-[32px] px-[22px] py-[20px] flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-[38px] h-[38px] rounded-[14px] bg-orange-50 flex items-center justify-center flex-shrink-0">
          <CalendarX2 size={18} strokeWidth={2.1} className="text-orange-700" />
        </span>
        <div>
          <p className="font-display font-semibold text-[19px] text-ink">Krock i skrivschemat</p>
          <p className="text-[13px] text-ink-soft">
            Två av dina sparade prövningar skrivs samma dag.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {clashes.map((clash) => (
          <li key={clash.date} className="bg-cream rounded-[20px] px-[18px] py-3.5">
            <p className="font-display font-semibold text-[16px] text-ink">
              {listCourses(clash.exams.map((e) => e.course))}
            </p>
            <p className="text-[13.5px] text-orange-700 mt-px">
              Skrivs {longDate(clash.date)}
              {clash.sameSchool ? ` hos ${clash.exams[0].schoolName}` : ''}.{' '}
              {clash.exams.length > 2 ? 'Du hinner bara ett av dem.' : 'Du hinner bara det ena.'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** `['A', 'B', 'C']` → `A, B och C`. */
function listCourses(courses: string[]): string {
  if (courses.length < 2) return courses.join('');
  return `${courses.slice(0, -1).join(', ')} och ${courses[courses.length - 1]}`;
}

/** `2026-10-26` → `måndag 26 oktober`. */
function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
