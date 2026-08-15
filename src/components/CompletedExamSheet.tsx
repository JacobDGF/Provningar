import { X, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { CompletedExam } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface CompletedExamDraft {
  subject: string;
  course: string;
  date: string;
  grade: string;
}

/**
 * The one sheet for logging a prövning and for correcting one afterwards.
 *
 * Correcting matters more than it looks: these rows feed the meritvärde average
 * on the profile, so a grade in the wrong row is a wrong answer to the question
 * the whole app is about. It used to be unreachable — the list only ever grew.
 */
export function CompletedExamSheet({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  /** Undefined when logging a new prövning, the existing row when correcting one. */
  initial?: CompletedExam;
  onSave: (draft: CompletedExamDraft) => void;
  /** Only passed when editing — a row that doesn't exist yet has nothing to delete. */
  onDelete?: () => void;
  onClose: () => void;
}) {
  const editing = initial !== undefined;
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [course, setCourse] = useState(initial?.course ?? '');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? '');
  const [grade, setGrade] = useState(initial?.grade ?? 'A');

  useEscapeKey(
    useCallback(() => onClose(), [onClose]),
    true,
  );

  const canSave = Boolean(subject.trim() && course.trim() && date);

  return (
    // Backdrop closes on click as a mouse convenience; the sheet has its own
    // keyboard-reachable close button below, so this isn't the only way out.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stops the backdrop's close-on-click from firing when interacting with the sheet itself */}
      <div
        className="bg-cream w-full lg:max-w-md rounded-t-lg lg:rounded-lg p-6 animate-sheet-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink font-display">
            {editing ? 'Ändra prövning' : 'Lägg till prövning'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="w-8 h-8 bg-sand rounded-full flex items-center justify-center"
          >
            <X size={16} className="text-ink-soft" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ämne (t.ex. Matematik)"
            aria-label="Ämne"
            className="w-full bg-surface border border-line rounded px-4 py-3 text-sm outline-none focus-visible:border-brand-400"
          />
          <input
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="Kurs (t.ex. Matematik 3b)"
            aria-label="Kurs"
            className="w-full bg-surface border border-line rounded px-4 py-3 text-sm outline-none focus-visible:border-brand-400"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Datum"
            className="w-full bg-surface border border-line rounded px-4 py-3 text-sm outline-none focus-visible:border-brand-400"
          />
          <div>
            <p className="text-xs text-ink-soft font-semibold mb-2">Betyg</p>
            <div className="flex gap-2">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  aria-pressed={grade === g}
                  className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
                    grade === g
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface border border-line text-ink-soft'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() =>
              canSave && onSave({ subject: subject.trim(), course: course.trim(), date, grade })
            }
            disabled={!canSave}
            className="w-full bg-brand-500 disabled:bg-sand disabled:text-ink-faint text-white font-bold py-4 rounded-md"
          >
            Spara
          </button>
          {onDelete && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Ta bort prövningen ur din historik? Snittpoängen räknas om utan den.',
                  )
                ) {
                  onDelete();
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-red-500 font-semibold py-3 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} /> Ta bort prövningen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
