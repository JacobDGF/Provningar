import { ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';
import { getExamStatus } from '../lib/examStatusColor';

interface ExamCardProps {
  exam: Exam;
  /** Show distance instead of city in the footer — set when "Nära mig" is on. */
  showDistance?: boolean;
}

/**
 * One listing, as the redesign draws it.
 *
 * The card used to be a photo with eight facts stacked under it. This is the
 * same listing reduced to what a reader actually scans in a grid of twenty: a
 * 9px bar in the status colour, the course, the school, one chip saying where
 * the round stands, and a foot with the price. Everything else — components,
 * study tips, the provider's paragraph — is one tap away and was never read
 * here.
 *
 * The colour bar is the whole point of the shape. It is the first thing on the
 * card, it is unambiguous at arm's length, and it comes from the same table as
 * the detail sheet's hero, so a red card can never open a teal page.
 */
export function ExamCard({ exam, showDistance }: ExamCardProps) {
  const { isExamSaved, saveExam, unsaveExam, setShowingExamDetail, userLocation } = useStore();
  const saved = isExamSaved(exam.id);
  const status = getExamStatus(exam);

  const distanceKm = userLocation
    ? haversineDistanceKm(userLocation.lat, userLocation.lng, exam.lat, exam.lng)
    : null;

  const foot =
    showDistance && distanceKm !== null
      ? `${formatDistanceKm(distanceKm)} · ${exam.city}`
      : `${exam.city} · ${exam.price} kr`;

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) unsaveExam(exam.id);
    else saveExam(exam.id);
  };

  const open = () => setShowingExamDetail(exam.id);

  return (
    <div
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      className="group relative flex flex-col bg-surface border-[1.5px] border-line rounded-[28px] overflow-hidden cursor-pointer transition-[transform,border-color] duration-150 hover:-translate-y-1 hover:border-ink"
    >
      {/* The status, before any words */}
      <div className={`h-[9px] w-full ${status.tone.rail}`} aria-hidden="true" />

      <button
        onClick={handleToggleSave}
        aria-label={saved ? 'Ta bort från sparade' : 'Spara prövning'}
        className={`absolute top-5 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          saved
            ? 'bg-amber-accent-50 text-amber-accent'
            : 'bg-cream text-ink-faint hover:bg-sand hover:text-ink-soft'
        }`}
      >
        {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      </button>

      <div className="p-[22px] pr-14 flex flex-col gap-3.5 flex-1">
        <div>
          <h3 className="font-hero text-[26px] sm:text-[30px] leading-[1.02] text-ink">
            {exam.course}
          </h3>
          <p className="font-display italic text-[15.5px] text-ink-soft mt-1.5">
            {exam.schoolName}
          </p>
        </div>

        <span
          className={`font-bold text-[13px] px-[15px] py-[9px] rounded-full w-fit ${status.tone.softChip}`}
        >
          {status.label}
        </span>

        <div className="mt-auto flex items-center justify-between gap-2.5 pt-3 border-t-[1.5px] border-sand">
          <span className="text-[13.5px] font-bold text-ink-soft tnum">{foot}</span>
          <span className="w-[34px] h-[34px] rounded-xl bg-ink text-cream flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={16} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </div>
  );
}
