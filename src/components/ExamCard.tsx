import {
  MapPin,
  Calendar,
  Tag,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';
import { isOpenForRegistration, daysUntil } from '../lib/examStatus';

interface ExamCardProps {
  exam: Exam;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  interested: 'bg-amber-accent-50 text-amber-accent',
  registered: 'bg-brand-100 text-brand-700',
  completed: 'bg-sand text-ink-soft',
  passed: 'bg-trust-50 text-trust-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  interested: 'Intresserad',
  registered: 'Anmäld',
  completed: 'Genomförd',
  passed: 'Godkänd',
  failed: 'Underkänd',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

export function ExamCard({ exam, compact }: ExamCardProps) {
  const { isExamSaved, saveExam, unsaveExam, savedExams, setShowingExamDetail, userLocation } =
    useStore();
  const saved = isExamSaved(exam.id);
  const savedExam = savedExams.find((e) => e.examId === exam.id);

  const { nextPeriod } = exam;
  const deadlineDate = nextPeriod.confirmed ? nextPeriod.applicationEnd : undefined;
  const deadlineDays = deadlineDate ? daysUntil(deadlineDate) : null;
  const urgent = deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0;
  const openNow = isOpenForRegistration(exam);

  const distanceKm = userLocation
    ? haversineDistanceKm(userLocation.lat, userLocation.lng, exam.lat, exam.lng)
    : null;

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      unsaveExam(exam.id);
    } else {
      saveExam(exam.id);
    }
  };

  const handleOpen = () => setShowingExamDetail(exam.id);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="bg-surface rounded-md overflow-hidden shadow-sm border border-line active:scale-98 transition-transform cursor-pointer"
    >
      {/* Image */}
      <div className="relative">
        <img
          src={exam.schoolImage}
          alt={exam.schoolName}
          className={`w-full object-cover ${compact ? 'h-36' : 'h-48'}`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Save button */}
        <button
          onClick={handleToggleSave}
          aria-label={saved ? 'Ta bort från sparade' : 'Spara prövning'}
          className="absolute top-3 right-3 w-10 h-10 bg-surface/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          {saved ? (
            <BookmarkCheck size={19} className="text-brand-600" />
          ) : (
            <Bookmark size={19} className="text-ink-soft" />
          )}
        </button>

        {/* Urgent badge */}
        {urgent && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Clock size={11} />
            {deadlineDays === 0 ? 'Sista dag!' : `${deadlineDays}d kvar`}
          </div>
        )}

        {/* Distance badge */}
        {distanceKm !== null && (
          <div
            className={`absolute top-3 ${urgent ? 'left-24' : 'left-3'} bg-surface/95 backdrop-blur-sm text-ink text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}
          >
            <Navigation size={11} className="text-brand-600" />
            {formatDistanceKm(distanceKm)}
          </div>
        )}

        {/* Status badge on saved exams */}
        {savedExam && (
          <div
            className={`absolute top-3 right-14 text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[savedExam.status]}`}
          >
            {STATUS_LABELS[savedExam.status]}
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white/85 text-xs font-medium">{exam.schoolName}</p>
          <h3 className="text-white font-bold text-lg leading-tight font-display">{exam.course}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {openNow && (
          <div className="inline-flex items-center gap-1.5 bg-trust-50 text-trust-700 text-xs font-bold px-2.5 py-1 rounded-full mb-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trust-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-trust-600" />
            </span>
            Öppen för anmälan just nu
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Tag size={11} />
            {exam.subject}
          </span>
          <span className="bg-sand text-ink-soft text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin size={11} />
            {exam.city}
          </span>
          <span className="bg-trust-50 text-trust-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={11} />
            {exam.provider}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-ink-faint text-xs">Anmälan</p>
            {nextPeriod.confirmed ? (
              <p className={`text-sm font-bold ${urgent ? 'text-red-600' : 'text-ink'}`}>
                {nextPeriod.applicationEnd
                  ? formatDate(nextPeriod.applicationEnd)
                  : nextPeriod.label}
              </p>
            ) : (
              <p className="text-sm font-semibold text-ink-faint">Se hos skolan</p>
            )}
          </div>
          <div>
            <p className="text-ink-faint text-xs">Provperiod</p>
            <p className="text-sm font-bold text-ink flex items-center gap-1">
              <Calendar size={13} className="text-brand-500" />
              {nextPeriod.confirmed && nextPeriod.examWindowStart
                ? formatDate(nextPeriod.examWindowStart)
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-ink-faint text-xs">Pris</p>
            <p className="text-sm font-bold text-ink">{exam.price} kr</p>
          </div>
          <div>
            <p className="text-ink-faint text-xs">Nivå</p>
            <p className="text-sm font-bold text-ink">{exam.level}</p>
          </div>
        </div>

        <a
          href={exam.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold py-3 rounded transition-colors active:scale-98 shadow-sm shadow-brand-200"
        >
          <ExternalLink size={15} />
          Anmäl dig hos {exam.provider}
        </a>
      </div>
    </div>
  );
}
