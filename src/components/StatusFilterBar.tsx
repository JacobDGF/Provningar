import { Exam } from '../types';
import { STATUS_ORDER, STATUS_TONES, countByStatus } from '../lib/examStatusColor';
import { useStore } from '../store/useStore';

interface StatusFilterBarProps {
  /** The listings the counts are drawn from — the unfiltered set, so the
      numbers stay put as the user clicks between colours. */
  exams: Exam[];
  /** Row heading, rendered by the bar itself so it disappears along with the
      chips when there is only one colour to show. */
  label?: string;
}

/**
 * The colour key, doubling as the filter.
 *
 * A legend that only explains is a thing to read once and never touch again;
 * the same row is far more useful when each swatch is the button that narrows
 * the list to it. Tapping "Fullbokat" is how you find out what you missed, and
 * tapping it again puts everything back.
 *
 * Colours with nothing in them are dropped rather than greyed: an empty
 * "Fullbokat" chip is a promise of results that aren't there.
 */
export function StatusFilterBar({ exams, label }: StatusFilterBarProps) {
  const { filterStatus, setFilterStatus } = useStore();
  const counts = countByStatus(exams);
  const visible = STATUS_ORDER.filter((key) => counts[key] > 0);

  if (visible.length < 2) return null;

  const bar = (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      role="group"
      aria-label="Filtrera på status"
    >
      <button
        onClick={() => setFilterStatus('')}
        aria-pressed={filterStatus === ''}
        className={`flex-shrink-0 text-[13.5px] font-bold px-[18px] py-2.5 rounded-full border-[1.5px] transition-transform hover:-translate-y-0.5 ${
          filterStatus === ''
            ? 'bg-ink text-cream border-ink'
            : 'bg-cream text-ink-soft border-line hover:border-ink'
        }`}
      >
        Alla ({exams.length})
      </button>
      {visible.map((key) => {
        const tone = STATUS_TONES[key];
        const active = filterStatus === key;
        return (
          <button
            key={key}
            onClick={() => setFilterStatus(active ? '' : key)}
            aria-pressed={active}
            title={tone.meaning}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[13.5px] font-bold px-[18px] py-2.5 rounded-full transition-transform hover:-translate-y-0.5 ${
              active ? tone.chip : tone.softChip
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-white' : tone.dot}`}
            />
            {tone.shortLabel} ({counts[key]})
          </button>
        );
      })}
    </div>
  );

  if (!label) return bar;

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[11.5px] font-bold uppercase tracking-[.09em] text-ink-faint">{label}</p>
      {bar}
    </div>
  );
}
