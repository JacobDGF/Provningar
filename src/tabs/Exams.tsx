import { BookMarked, ChevronDown, Compass, List, CalendarDays } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { CalendarView } from './CalendarTab';
import { SavedExam } from '../types';
import { compareByPeriod } from '../lib/examStatus';

const STATUS_OPTIONS: { value: SavedExam['status']; label: string; color: string }[] = [
  { value: 'interested', label: 'Intresserad', color: 'bg-amber-accent-50 text-amber-accent' },
  { value: 'registered', label: 'Anmäld', color: 'bg-brand-100 text-brand-700' },
  { value: 'completed', label: 'Genomförd', color: 'bg-sand text-ink-soft' },
  { value: 'passed', label: 'Godkänd', color: 'bg-trust-50 text-trust-700' },
  { value: 'failed', label: 'Underkänd', color: 'bg-red-100 text-red-700' },
];

function StatusPicker({ examId }: { examId: string }) {
  const { savedExams, updateExamStatus } = useStore();
  const saved = savedExams.find((e) => e.examId === examId);
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((o) => o.value === saved?.status) || STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${current.color}`}
      >
        {current.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 bg-surface border border-line rounded shadow-lg z-10 overflow-hidden min-w-max">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                updateExamStatus(examId, opt.value);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-sand ${opt.value === saved?.status ? 'font-bold' : ''}`}
            >
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${opt.color}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Exams() {
  const { savedExams, exams, unsaveExam, setActiveTab } = useStore();
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const savedWithData = useMemo(() => {
    return savedExams
      .map((se) => ({ saved: se, exam: exams.find((e) => e.id === se.examId) }))
      .filter((x): x is { saved: SavedExam; exam: (typeof exams)[0] } => !!x.exam)
      .filter((x) => activeStatus === 'all' || x.saved.status === activeStatus)
      .sort((a, b) => {
        const byPeriod = compareByPeriod(a.exam, b.exam);
        return byPeriod !== 0 ? byPeriod : a.saved.savedAt.localeCompare(b.saved.savedAt);
      });
  }, [savedExams, exams, activeStatus]);

  const counts: Record<string, number> = { all: savedExams.length };
  savedExams.forEach((se) => {
    counts[se.status] = (counts[se.status] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface px-4 lg:px-8 pt-14 lg:pt-8 pb-4 sticky top-0 z-30 border-b border-line">
        <div className="max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 lg:w-14 lg:h-14 bg-brand-500 rounded-md flex items-center justify-center shadow-sm shadow-brand-200 flex-shrink-0">
              <BookMarked size={22} className="text-white lg:w-7 lg:h-7" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-ink font-display">
                Mina prövningar
              </h1>
              <p className="text-ink-soft text-sm lg:text-base">{savedExams.length} sparade</p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex bg-sand rounded-md p-1 mb-3 lg:max-w-sm">
            <button
              onClick={() => setView('list')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-sm font-semibold transition-all ${
                view === 'list' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              <List size={16} /> Lista
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-sm font-semibold transition-all ${
                view === 'calendar' ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              <CalendarDays size={16} /> Kalender
            </button>
          </div>

          {/* Status filter tabs (list view only) */}
          {view === 'list' && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveStatus('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeStatus === 'all' ? 'bg-ink text-white' : 'bg-sand text-ink-soft'
                }`}
              >
                Alla {counts.all > 0 && `(${counts.all})`}
              </button>
              {STATUS_OPTIONS.map(
                (opt) =>
                  (counts[opt.value] || 0) > 0 && (
                    <button
                      key={opt.value}
                      onClick={() => setActiveStatus(opt.value)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        activeStatus === opt.value ? opt.color : 'bg-sand text-ink-soft'
                      }`}
                    >
                      {opt.label} ({counts[opt.value]})
                    </button>
                  ),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 lg:pb-8">
        <div className="max-w-screen-2xl mx-auto w-full">
          {view === 'calendar' ? (
            <CalendarView />
          ) : savedWithData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-20 h-20 bg-brand-50 rounded-lg flex items-center justify-center mb-5">
                <BookMarked size={34} className="text-brand-400" />
              </div>
              <h3 className="text-ink font-bold text-lg mb-2">Inga sparade prövningar</h3>
              <p className="text-ink-soft text-sm mb-6 max-w-xs">
                {activeStatus === 'all'
                  ? 'Tryck på bokmärket på en prövning för att spara den här och hålla koll på datum.'
                  : `Inga prövningar med status "${STATUS_OPTIONS.find((o) => o.value === activeStatus)?.label}".`}
              </p>
              {activeStatus === 'all' && (
                <button
                  onClick={() => setActiveTab('discover')}
                  className="flex items-center gap-2 bg-brand-500 text-white text-base font-bold px-6 py-3.5 rounded-md shadow-md shadow-brand-200 active:scale-95 transition-transform"
                >
                  <Compass size={18} />
                  Upptäck prövningar
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 lg:px-8 py-4 lg:py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedWithData.map(({ saved, exam }) => (
                <div key={saved.examId}>
                  <ExamCard exam={exam} />
                  <div className="mt-2 flex items-center justify-between bg-surface border border-line rounded px-3 py-2">
                    <StatusPicker examId={saved.examId} />
                    <button
                      onClick={() => unsaveExam(exam.id)}
                      className="text-red-500 text-xs font-semibold px-2 py-1"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
