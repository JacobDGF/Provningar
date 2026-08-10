import { MapPin, Calendar, Tag, Bookmark, BookmarkCheck, ExternalLink, Clock, Navigation, ShieldCheck, ArrowRightCircle, Info } from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';
import { isOpenForRegistration, daysUntil } from '../lib/examStatus';
import { classifyRegistrationUrl, REGISTRATION_KIND_META } from '../lib/registration';
import { SubjectCrest } from './SubjectCrest';

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
  const { isExamSaved, saveExam, unsaveExam, savedExams, setShowingExamDetail, userLocation } = useStore();
  const saved = isExamSaved(exam.id);
  const savedExam = savedExams.find(e => e.examId === exam.id);

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
    saved ? unsaveExam(exam.id) : saveExam(exam.id);
  };

  const handleOpen = () => setShowingExamDetail(exam.id);

  const regKindId = classifyRegistrationUrl(exam.registrationUrl);
  const regKind = REGISTRATION_KIND_META[regKindId];
  const directBooking = regKindId === 'booking';

  return (
    <div
      onClick={handleOpen}
      className="bg-surface rounded-md overflow-hidden shadow-sm border border-line active:scale-98 transition-transform cursor-pointer h-full flex flex-col"
    >
      {/* Image */}
      <div className="relative flex-shrink-0">
        <SubjectCrest exam={exam} className={`w-full ${compact ? 'h-36' : 'h-48'}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Save button */}
        <button
          onClick={handleToggleSave}
          aria-label={saved ? 'Ta bort från sparade' : 'Spara prövning'}
          className="absolute top-3 right-3 w-10 h-10 bg-surface/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          {saved
            ? <BookmarkCheck size={19} className="text-brand-600" />
            : <Bookmark size={19} className="text-ink-soft" />
          }
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
          <div className={`absolute top-3 ${urgent ? 'left-24' : 'left-3'} bg-surface/95 backdrop-blur-sm text-ink text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
            <Navigation size={11} className="text-brand-600" />
            {formatDistanceKm(distanceKm)}
          </div>
        )}

        {/* Status badge on saved exams */}
        {savedExam && (
          <div className={`absolute top-3 right-14 text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[savedExam.status]}`}>
            {STATUS_LABELS[savedExam.status]}
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white/85 text-xs font-medium">{exam.schoolName}</p>
          <h3 className="text-white font-bold text-lg leading-tight font-display">{exam.course}</h3>
        </div>
      </div>

      {/* Body — a column so the CTA can sit on the baseline of every card in a
          row regardless of how much metadata each listing carries. */}
      <div className="p-4 flex-1 flex flex-col">
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
            {/* Only ever a date here. `label` is a full sentence on some
                listings and rendering it raw stretched one card to twice the
                height of its row-mates. The sentence lives in the detail sheet. */}
            {nextPeriod.confirmed && nextPeriod.applicationEnd ? (
              <p className={`text-sm font-bold ${urgent ? 'text-red-600' : 'text-ink'}`}>
                {formatDate(nextPeriod.applicationEnd)}
              </p>
            ) : nextPeriod.confirmed ? (
              <p className="text-sm font-semibold text-ink">Se datum</p>
            ) : (
              <p className="text-sm font-semibold text-ink-faint">Se hos skolan</p>
            )}
          </div>
          <div>
            <p className="text-ink-faint text-xs">Provperiod</p>
            <p className="text-sm font-bold text-ink flex items-center gap-1">
              <Calendar size={13} className="text-brand-500" />
              {nextPeriod.confirmed && nextPeriod.examWindowStart ? formatDate(nextPeriod.examWindowStart) : '—'}
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

        <div className="mt-auto pt-4">
          <a
            href={exam.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold py-3 rounded transition-colors active:scale-98 shadow-sm shadow-brand-200"
          >
            <ExternalLink size={15} />
            {regKind.cta} {exam.provider}
          </a>
          <p className="mt-2 text-center text-xs text-ink-faint flex items-center justify-center gap-1.5">
            {directBooking
              ? <ArrowRightCircle size={12} className="text-trust-600" />
              : <Info size={12} />
            }
            <span className={directBooking ? 'text-trust-700 font-semibold' : undefined}>{regKind.badge}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
