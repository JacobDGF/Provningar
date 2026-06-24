import { Bookmark, ChevronDown, Compass } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ExamCard } from '../components/ExamCard';
import { SavedExam } from '../types';

const STATUS_OPTIONS: { value: SavedExam['status']; label: string; color: string }[] = [
  { value: 'interested', label: 'Intresserad', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'registered', label: 'Anmäld', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Genomförd', color: 'bg-gray-100 text-gray-700' },
  { value: 'passed', label: 'Godkänd', color: 'bg-green-100 text-green-700' },
  { value: 'failed', label: 'Underkänd', color: 'bg-red-100 text-red-700' },
];

function StatusPicker({ examId }: { examId: string }) {
  const { savedExams, updateExamStatus } = useStore();
  const saved = savedExams.find(e => e.examId === examId);
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find(o => o.value === saved?.status) || STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${current.color}`}
      >
        {current.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-max">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={e => { e.stopPropagation(); updateExamStatus(examId, opt.value); setOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 ${opt.value === saved?.status ? 'font-bold' : ''}`}
            >
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${opt.color}`}>{opt.label}</span>
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

  const savedWithData = useMemo(() => {
    return savedExams
      .map(se => ({ saved: se, exam: exams.find(e => e.id === se.examId) }))
      .filter((x): x is { saved: SavedExam; exam: typeof exams[0] } => !!x.exam)
      .filter(x => activeStatus === 'all' || x.saved.status === activeStatus)
      .sort((a, b) => {
        const da = a.exam.nextPeriod.confirmed ? a.exam.nextPeriod.applicationEnd : undefined;
        const db = b.exam.nextPeriod.confirmed ? b.exam.nextPeriod.applicationEnd : undefined;
        if (da && db) return da.localeCompare(db);
        if (da) return -1;
        if (db) return 1;
        return a.saved.savedAt.localeCompare(b.saved.savedAt);
      });
  }, [savedExams, exams, activeStatus]);

  const counts: Record<string, number> = { all: savedExams.length };
  savedExams.forEach(se => { counts[se.status] = (counts[se.status] || 0) + 1; });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Mina prövningar</h1>
          <p className="text-gray-500 text-sm">{savedExams.length} sparade</p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveStatus('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeStatus === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Alla {counts.all > 0 && `(${counts.all})`}
          </button>
          {STATUS_OPTIONS.map(opt => (
            (counts[opt.value] || 0) > 0 && (
              <button
                key={opt.value}
                onClick={() => setActiveStatus(opt.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeStatus === opt.value ? opt.color : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label} ({counts[opt.value]})
              </button>
            )
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {savedWithData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Bookmark size={28} className="text-blue-400" />
            </div>
            <h3 className="text-gray-800 font-semibold mb-2">Inga sparade prövningar</h3>
            <p className="text-gray-500 text-sm mb-5">
              {activeStatus === 'all'
                ? 'Tryck på bokmärkesikonen på en prövning för att spara den här.'
                : `Inga prövningar med status "${STATUS_OPTIONS.find(o => o.value === activeStatus)?.label}".`}
            </p>
            {activeStatus === 'all' && (
              <button
                onClick={() => setActiveTab('discover')}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl"
              >
                <Compass size={16} />
                Upptäck prövningar
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {savedWithData.map(({ saved, exam }) => (
              <div key={saved.examId}>
                <ExamCard exam={exam} />
                <div className="mt-2 flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
                  <StatusPicker examId={saved.examId} />
                  <button
                    onClick={() => unsaveExam(exam.id)}
                    className="text-red-500 text-xs font-medium"
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
  );
}
