import { Trash2, Compass } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getExamStatus } from '../lib/examStatusColor';
import { timeAgo } from '../lib/relativeTime';

export function History() {
  const { viewedExams, exams, clearHistory, removeViewed, setShowingExamDetail, setActiveTab } =
    useStore();

  const rows = viewedExams
    .map((v) => ({ v, exam: exams.find((e) => e.id === v.examId) }))
    .filter((r): r is { v: (typeof viewedExams)[0]; exam: (typeof exams)[0] } => !!r.exam);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-cream">
      <div className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8 pt-14 lg:pt-8 flex flex-col gap-5 animate-rise-in pb-28 lg:pb-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="font-hero-xl text-[38px] sm:text-[48px] lg:text-[56px] leading-none text-ink">
            Nyligen visade
          </h1>
          {rows.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[13.5px] font-bold text-ink-soft hover:text-red-600 transition-colors"
            >
              Rensa allt
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="bg-surface border-[1.5px] border-dashed border-line rounded-[26px] p-9 text-center">
            <p className="font-display italic text-[18px] text-ink-soft">
              Inget kvar här — allt är rensat.
            </p>
            <button
              onClick={() => setActiveTab('discover')}
              className="mt-4 inline-flex items-center gap-2 bg-ink text-cream text-[14px] font-bold px-5 py-3 rounded-[20px]"
            >
              <Compass size={16} /> Upptäck prövningar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map(({ v, exam }) => {
              const status = getExamStatus(exam);
              return (
                <div
                  key={v.examId}
                  className="flex items-center gap-3 bg-surface border-[1.5px] border-line rounded-[26px] pl-[22px] pr-3.5 py-3"
                >
                  <button
                    onClick={() => setShowingExamDetail(exam.id)}
                    className="flex items-center gap-[18px] flex-1 min-w-0 py-1.5 text-left transition-transform hover:translate-x-1"
                  >
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${status.tone.dot}`}
                      title={status.label}
                    />
                    <span className="font-display font-semibold text-[19px] text-ink flex-1 min-w-0 truncate">
                      {exam.course}
                    </span>
                    <span className="hidden sm:block text-[14px] text-ink-soft font-semibold flex-shrink-0">
                      {exam.city}
                    </span>
                    <span className="text-[13px] text-ink-faint font-bold whitespace-nowrap flex-shrink-0">
                      {timeAgo(v.viewedAt)}
                    </span>
                  </button>
                  <button
                    onClick={() => removeViewed(v.examId)}
                    aria-label={`Ta bort ${exam.course} ur historiken`}
                    className="w-10 h-10 border-[1.5px] border-line bg-cream rounded-[14px] flex items-center justify-center text-ink-soft flex-shrink-0 transition-colors hover:bg-red-600 hover:text-white hover:border-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
