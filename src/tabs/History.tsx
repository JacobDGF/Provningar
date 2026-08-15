import {
  History as HistoryIcon,
  Clock,
  GraduationCap,
  MapPin,
  Trash2,
  Compass,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { SchoolCover } from '../components/SchoolCover';
import { CompletedExamSheet } from '../components/CompletedExamSheet';
import { gradeChipClass } from '../lib/grades';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 7)
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  if (days > 0) return `${days} d sedan`;
  if (hours > 0) return `${hours} h sedan`;
  if (mins > 0) return `${mins} min sedan`;
  return 'Nyss';
}

export function History() {
  const {
    viewedExams,
    exams,
    currentUser,
    setShowingExamDetail,
    clearHistory,
    setActiveTab,
    updateCompletedExam,
    removeCompletedExam,
  } = useStore();
  /** Index into `completedExams` of the row being corrected, or null. */
  const [editing, setEditing] = useState<number | null>(null);

  const viewed = viewedExams
    .map((v) => ({ v, exam: exams.find((e) => e.id === v.examId) }))
    .filter((x): x is { v: (typeof viewedExams)[0]; exam: (typeof exams)[0] } => !!x.exam);

  // Newest first, but each row carries the index the store writes back to.
  const completed = currentUser.completedExams.map((ce, index) => ({ ce, index })).reverse();

  const isEmpty = viewed.length === 0 && completed.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface px-4 lg:px-8 pt-14 lg:pt-8 pb-4 sticky top-0 z-30 border-b border-line">
        <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 lg:w-14 lg:h-14 bg-brand-500 rounded-md flex items-center justify-center shadow-sm shadow-brand-200 flex-shrink-0">
              <HistoryIcon size={22} className="text-white lg:w-7 lg:h-7" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-ink font-display">Historik</h1>
              <p className="text-ink-soft text-sm lg:text-base">
                Prövningar du tittat på & genomfört
              </p>
            </div>
          </div>
          {viewed.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Rensa historiken över visade prövningar?')) clearHistory();
              }}
              className="flex items-center gap-1 text-ink-soft text-xs font-semibold bg-sand px-3 py-2 rounded-full active:scale-95 hover:bg-line transition-colors"
            >
              <Trash2 size={13} /> Rensa
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 lg:pb-8">
        <div className="max-w-screen-2xl mx-auto w-full">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-20 h-20 bg-brand-50 rounded-lg flex items-center justify-center mb-5">
                <HistoryIcon size={34} className="text-brand-400" />
              </div>
              <h3 className="text-ink font-bold text-lg mb-2">Ingen historik än</h3>
              <p className="text-ink-soft text-sm mb-6 max-w-xs">
                Prövningar du öppnar dyker upp här så att du enkelt hittar tillbaka till dem.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="flex items-center gap-2 bg-brand-500 text-white text-base font-bold px-6 py-3.5 rounded-md shadow-md shadow-brand-200 active:scale-95 transition-transform"
              >
                <Compass size={18} />
                Utforska prövningar
              </button>
            </div>
          ) : (
            <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-6">
              {/* Recently viewed */}
              {viewed.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-ink-soft uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Clock size={15} className="text-brand-500" />
                    Nyligen visade
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {viewed.map(({ v, exam }) => (
                      <button
                        key={v.examId}
                        onClick={() => setShowingExamDetail(exam.id)}
                        className="w-full bg-surface border border-line rounded-md p-3 flex items-center gap-3 text-left active:scale-98 transition-transform"
                      >
                        <SchoolCover exam={exam} className="w-14 h-14 rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink text-sm truncate">{exam.course}</p>
                          <p className="text-xs text-ink-soft truncate flex items-center gap-1">
                            <MapPin size={11} /> {exam.schoolName} · {exam.city}
                          </p>
                          <p className="text-[11px] text-ink-faint mt-0.5">
                            Visad {timeAgo(v.viewedAt)}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-ink-faint flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed exams */}
              <div>
                <h2 className="text-sm font-bold text-ink-soft uppercase tracking-wide mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-trust-500" />
                  Genomförda prövningar
                </h2>
                {completed.length === 0 ? (
                  <div className="bg-sand rounded-md p-5 text-center">
                    <p className="text-ink-soft text-sm">
                      Inga genomförda prövningar registrerade än. Lägg till dem på din profil när du
                      klarat en prövning.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                    {completed.map(({ ce, index }) => (
                      <button
                        key={index}
                        onClick={() => setEditing(index)}
                        aria-label={`Ändra ${ce.course}`}
                        className="bg-surface border border-line rounded-md p-3 flex items-center gap-3 text-left hover:border-brand-200 active:scale-98 transition-all"
                      >
                        <div
                          className={`w-12 h-12 rounded flex items-center justify-center font-bold text-xl flex-shrink-0 ${gradeChipClass(ce.grade)}`}
                        >
                          {ce.grade || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink text-sm truncate">{ce.course}</p>
                          <p className="text-xs text-ink-soft">
                            {ce.subject} ·{' '}
                            {new Date(ce.date).toLocaleDateString('sv-SE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Edit3 size={15} className="text-ink-faint flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {editing !== null && (
        <CompletedExamSheet
          initial={currentUser.completedExams[editing]}
          onSave={(draft) => {
            updateCompletedExam(editing, draft);
            setEditing(null);
          }}
          onDelete={() => {
            removeCompletedExam(editing);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
