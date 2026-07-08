import { History as HistoryIcon, Clock, GraduationCap, MapPin, Trash2, Compass, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 7) return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  if (days > 0) return `${days} d sedan`;
  if (hours > 0) return `${hours} h sedan`;
  if (mins > 0) return `${mins} min sedan`;
  return 'Nyss';
}

export function History() {
  const { viewedExams, exams, currentUser, setShowingExamDetail, clearHistory, setActiveTab } = useStore();

  const viewed = viewedExams
    .map(v => ({ v, exam: exams.find(e => e.id === v.examId) }))
    .filter((x): x is { v: typeof viewedExams[0]; exam: typeof exams[0] } => !!x.exam);

  const completed = [...currentUser.completedExams].reverse();

  const isEmpty = viewed.length === 0 && completed.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface px-4 pt-14 pb-4 sticky top-0 z-30 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-500 rounded-2xl flex items-center justify-center shadow-sm shadow-brand-200 flex-shrink-0">
              <HistoryIcon size={22} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink font-display">Historik</h1>
              <p className="text-ink-soft text-sm">Prövningar du tittat på & genomfört</p>
            </div>
          </div>
          {viewed.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Rensa historiken över visade prövningar?')) clearHistory(); }}
              className="flex items-center gap-1 text-ink-soft text-xs font-semibold bg-sand px-3 py-2 rounded-full active:scale-95"
            >
              <Trash2 size={13} /> Rensa
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-5">
              <HistoryIcon size={34} className="text-brand-400" />
            </div>
            <h3 className="text-ink font-bold text-lg mb-2">Ingen historik än</h3>
            <p className="text-ink-soft text-sm mb-6 max-w-xs">
              Prövningar du öppnar dyker upp här så att du enkelt hittar tillbaka till dem.
            </p>
            <button
              onClick={() => setActiveTab('discover')}
              className="flex items-center gap-2 bg-brand-500 text-white text-base font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-brand-200 active:scale-95 transition-transform"
            >
              <Compass size={18} />
              Utforska prövningar
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {/* Recently viewed */}
            {viewed.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-ink-soft uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock size={15} className="text-brand-500" />
                  Nyligen visade
                </h2>
                <div className="space-y-2">
                  {viewed.map(({ v, exam }) => (
                    <button
                      key={v.examId}
                      onClick={() => setShowingExamDetail(exam.id)}
                      className="w-full bg-surface border border-line rounded-2xl p-3 flex items-center gap-3 text-left active:scale-98 transition-transform"
                    >
                      <img src={exam.schoolImage} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink text-sm truncate">{exam.course}</p>
                        <p className="text-xs text-ink-soft truncate flex items-center gap-1">
                          <MapPin size={11} /> {exam.schoolName} · {exam.city}
                        </p>
                        <p className="text-[11px] text-ink-faint mt-0.5">Visad {timeAgo(v.viewedAt)}</p>
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
                <div className="bg-sand rounded-2xl p-5 text-center">
                  <p className="text-ink-soft text-sm">
                    Inga genomförda prövningar registrerade än. Lägg till dem på din profil när du klarat en prövning.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completed.map((ce, i) => (
                    <div key={i} className="bg-surface border border-line rounded-2xl p-3 flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                        ce.grade === 'A' ? 'bg-trust-50 text-trust-700' :
                        ce.grade === 'B' || ce.grade === 'C' ? 'bg-brand-100 text-brand-700' :
                        ce.grade === 'D' || ce.grade === 'E' ? 'bg-amber-accent-50 text-amber-accent' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ce.grade || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink text-sm truncate">{ce.course}</p>
                        <p className="text-xs text-ink-soft">
                          {ce.subject} · {new Date(ce.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
