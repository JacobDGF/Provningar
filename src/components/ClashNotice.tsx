import { useMemo } from 'react';
import { CalendarX2 } from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { clashDayLabel, findClashes } from '../lib/examClash';

/**
 * De sparade prövningar som skrivs samma dag hos samma anordnare.
 *
 * Kalendern visar redan varje sparad omgång, men den visar dem som en period:
 * fyra Malmökurser ligger alla "26 oktober – 25 november", och det ser ut som
 * fyra prövningar man hinner med. Det är skrivdagen som avgör, och två prov
 * samma eftermiddag är inte ett val man gör i efterhand — Komvux Malmö skriver
 * ut att en sådan anmälan inte behandlas alls, och avgiften betalas inte
 * tillbaka.
 *
 * Panelen finns bara när den har något att säga. Den räknar inte upp de
 * sparade, den säger inte "inga krockar" och den har ingen egen knapp: enda
 * vägen vidare är listningen, där datumen och anmälan redan bor. Det är också
 * därför den inte lånar statusfärgerna — rött betyder fullbokat i hela appen,
 * och en krock är tvärtom två omgångar du fortfarande kan boka, men bara en av
 * dem.
 */
export function ClashNotice({ exams }: { exams: Exam[] }) {
  const { setShowingExamDetail } = useStore();
  const clashes = useMemo(() => findClashes(exams), [exams]);

  if (clashes.length === 0) return null;

  return (
    <section
      aria-label="Krockar i skrivschemat"
      className="bg-surface border-[1.5px] border-ink rounded-[32px] px-[22px] py-[20px] flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <span className="w-[38px] h-[38px] rounded-[14px] bg-ink flex items-center justify-center flex-shrink-0">
          <CalendarX2 size={18} strokeWidth={2.1} className="text-cream" />
        </span>
        <div>
          <p className="font-display font-semibold text-[19px] text-ink">
            {clashes.length === 1 ? 'Två prov samma dag' : `${clashes.length} krockar i schemat`}
          </p>
          <p className="text-[13px] text-ink-soft">
            Du kan bara skriva ett prov per skrivdag — välj en av dem innan du betalar.
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {clashes.map((clash) => (
          <li
            key={`${clash.schoolName}-${clash.date}`}
            className="bg-cream rounded-[20px] p-[18px]"
          >
            <p className="text-[10.5px] font-bold uppercase tracking-[.1em] text-ink-soft">
              {clashDayLabel(clash.date)} · {clash.schoolName}
            </p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {clash.exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setShowingExamDetail(exam.id)}
                  className="bg-surface border-[1.5px] border-line rounded-[16px] px-3.5 py-2 text-left transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-ink"
                >
                  <span className="block font-display font-semibold text-[15px] text-ink">
                    {exam.course}
                  </span>
                  <span className="block text-[12px] text-ink-soft tnum">{exam.courseCode}</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
