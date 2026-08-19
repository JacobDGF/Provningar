import { Exam } from '../types';
import { STATUS_ORDER, STATUS_TONES, countByStatus } from '../lib/examStatusColor';
import { useStore } from '../store/useStore';

interface StatusFilterBarProps {
  /** The listings the counts are drawn from — the unfiltered set, so the
      numbers stay put as the user clicks between colours. */
  exams: Exam[];
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
export function StatusFilterBar({ exams }: StatusFilterBarProps) {
  const { filterStatus, setFilterStatus } = useStore();
  const counts = countByStatus(exams);
  const visible = STATUS_ORDER.filter((key) => counts[key] > 0);

  if (visible.length < 2) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
      role="group"
      aria-label="Filtrera på status"
    >
      <button
        onClick={() => setFilterStatus('')}
        aria-pressed={filterStatus === ''}
        className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
          filterStatus === ''
            ? 'bg-ink text-white border-ink'
            : 'bg-surface text-ink-soft border-line hover:bg-sand'
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
            className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
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
}
