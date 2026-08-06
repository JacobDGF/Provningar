import { useMemo } from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { closingSoon, getDeadlineInfo } from '../lib/deadline';
import { useMinuteTick } from '../hooks/useMinuteTick';
import { ReminderButton } from './ReminderButton';

interface DeadlineRailProps {
  exams: Exam[];
}

/**
 * The front-page "anmälan stänger snart" rail.
 *
 * A prövning's application window is the whole game: miss it and the next
 * chance is typically months away, which pushes a university application to
 * the following admissions round. The listings closest to closing therefore
 * get the top of the page and the magenta spot colour, ahead of everything
 * else the app can show.
 */
export function DeadlineRail({ exams }: DeadlineRailProps) {
  const { setShowingExamDetail, setSearchQuery } = useStore();
  const tick = useMinuteTick();

  // tick keeps the countdown honest across midnight without a reload
  const urgent = useMemo(() => closingSoon(exams, 12), [exams, tick]);

  if (urgent.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-8 border-t border-line">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h6 className="text-accent2-700 text-xs font-semibold uppercase tracking-wider mb-2">
            Anmälan stänger snart
          </h6>
          <h2 className="font-display text-2xl font-semibold text-ink">Missa inte sista dagen</h2>
          <p className="text-sm text-ink-soft mt-1 max-w-[52ch]">
            När anmälan väl stängt är nästa tillfälle ofta månader bort. Lägg in en påminnelse i
            kalendern medan du tänker på det.
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:-mx-8 lg:px-8 pb-1">
        {urgent.map(exam => {
          const info = getDeadlineInfo(exam);
          const critical = info.urgency === 'critical';

          return (
            <article
              key={exam.id}
              onClick={() => setShowingExamDetail(exam.id)}
              className={`flex-shrink-0 w-[268px] bg-surface rounded-md border p-4 flex flex-col cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                critical ? 'border-accent2-200' : 'border-line'
              }`}
            >
              {/* Countdown — the reason this card is here, so it leads */}
              <div className="flex items-baseline gap-2 mb-3">
                <span
                  className={`font-display text-4xl font-semibold leading-none ${
                    critical ? 'text-accent2-700' : 'text-brand-700'
                  }`}
                >
                  {info.daysLeft === 0 ? 'Idag' : info.daysLeft}
                </span>
                {info.daysLeft !== 0 && (
                  <span className={`text-xs font-semibold ${critical ? 'text-accent2-700' : 'text-ink-soft'}`}>
                    {info.daysLeft === 1 ? 'dag kvar' : 'dagar kvar'}
                  </span>
                )}
                {info.daysLeft === 0 && (
                  <span className="text-xs font-semibold text-accent2-700">sista dagen</span>
                )}
              </div>

              <h3 className="font-display text-lg font-semibold text-ink leading-tight mb-0.5">
                {exam.course}
              </h3>
              <p className="text-xs text-ink-soft mb-1">{exam.schoolName}</p>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setSearchQuery(exam.city);
                }}
                className="text-xs text-brand-700 hover:underline text-left mb-3 w-fit"
              >
                {exam.city} · {exam.price} kr
              </button>

              <div className="mt-auto flex items-center gap-2">
                <a
                  href={exam.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-bold py-2.5 rounded transition-colors ${
                    critical ? 'bg-accent2-500 hover:bg-accent2-700' : 'bg-brand-500 hover:bg-brand-600'
                  }`}
                >
                  <ExternalLink size={13} />
                  Anmäl dig
                </a>
                <ReminderButton exam={exam} variant="icon" />
              </div>
            </article>
          );
        })}

        {/* Tail affordance: the rail is a teaser, the full list is below */}
        <button
          onClick={() => document.getElementById('alla-provningar')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex-shrink-0 w-[150px] rounded-md border border-dashed border-line flex flex-col items-center justify-center gap-2 text-ink-soft hover:text-ink hover:border-ink-faint transition-colors"
        >
          <ArrowRight size={18} />
          <span className="text-xs font-semibold">Se alla prövningar</span>
        </button>
      </div>
    </section>
  );
}
