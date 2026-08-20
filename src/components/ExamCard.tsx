import {
  MapPin,
  Calendar,
  Tag,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Navigation,
  ShieldCheck,
  MousePointerClick,
  Globe,
  Ban,
  CalendarX,
} from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';
import { hasApplicationClosed, applicationCell } from '../lib/examStatus';
import { getExamStatus } from '../lib/examStatusColor';
import { getRegistrationFlow } from '../lib/registrationFlow';
import { getExamAction } from '../lib/examAction';
import { SchoolCover } from './SchoolCover';

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
  // One call decides the card's colour, its badge and its deadline text, so the
  // three can't disagree — the rail, the pill and the date are the same fact
  // said three times, at three sizes.
  const status = getExamStatus(exam);
  const closed = hasApplicationClosed(exam);
  const cell = applicationCell(exam);
  const flow = getRegistrationFlow(exam);
  // What the buttons may promise. A closed round gets no booking button —
  // the colour at the top of the card and the button at the bottom have to
  // agree, and the button is the half people act on.
  const action = getExamAction(exam);

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
      {/* Status rail. Four pixels along the top edge, in the one colour that
          answers "can I book this?" — the only part of the card that is legible
          while scrolling a grid of twenty. */}
      <div className={`h-1 w-full ${status.tone.rail}`} aria-hidden="true" />

      {/* Image */}
      <div className="relative">
        <SchoolCover exam={exam} className={`w-full ${compact ? 'h-36' : 'h-48'}`} />
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

        {/* Status pill over the photo, in the rail's own colour: the same
            signal at reading size, so the colour never needs a caption. */}
        <div
          className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm ${status.tone.chip}`}
        >
          {status.tone.key === 'full' && <Ban size={11} strokeWidth={2.5} />}
          {status.label}
        </div>

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
        <div className="flex flex-wrap items-center gap-1.5 empty:hidden mb-2.5">
          {flow.direct && action.live && (
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full">
              <MousePointerClick size={11} />
              {flow.steps.length} steg till bokning
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Tag size={11} />
            {exam.subject}
          </span>
          <span className="bg-sand text-ink-soft text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin size={11} />
            {exam.city}
            {distanceKm !== null && (
              <>
                <Navigation size={10} className="text-brand-600 ml-0.5" />
                {formatDistanceKm(distanceKm)}
              </>
            )}
          </span>
          <span className="bg-trust-50 text-trust-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck size={11} />
            {exam.provider}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-ink-faint text-xs">Anmälan</p>
            {cell === 'full' ? (
              <p className="text-sm font-bold text-red-600 flex items-center gap-1">
                <Ban size={13} strokeWidth={2.5} />
                Fullbokat
              </p>
            ) : cell === 'deadline' ? (
              <p
                className={`text-sm font-bold ${closed ? 'text-ink-faint line-through decoration-ink-faint/60' : status.tone.text}`}
              >
                {formatDate(nextPeriod.applicationEnd!)}
              </p>
            ) : cell === 'opens' ? (
              <p className={`text-sm font-bold ${status.tone.text}`}>
                Öppnar {formatDate(nextPeriod.applicationStart!)}
              </p>
            ) : cell === 'open' ? (
              <p className="text-sm font-bold text-trust-700">Öppen nu</p>
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

        {/* Two destinations. On a live round the first is the booking and the
            second the school's own site; on a full or closed one they swap
            round — a red button saying why, pointing where the next omgång
            gets announced, and the dead form demoted to the small one. */}
        <div className="mt-4 flex gap-2">
          <a
            href={action.primary.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={action.primary.title}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded transition-colors active:scale-98 ${
              action.variant === 'full'
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200'
                : action.variant === 'closed'
                  ? 'bg-surface border border-line text-ink-soft hover:border-ink-faint'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-200'
            }`}
          >
            {action.variant === 'full' ? (
              <Ban size={15} strokeWidth={2.5} />
            ) : action.variant === 'closed' ? (
              <CalendarX size={15} />
            ) : (
              <ExternalLink size={15} />
            )}
            {action.primary.label}
          </a>
          {action.secondary && (
            <a
              href={action.secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={action.secondary.title}
              aria-label={action.secondary.title}
              className="flex items-center justify-center gap-1.5 bg-surface border border-line hover:border-brand-300 hover:bg-brand-50 text-ink-soft text-sm font-bold px-3 py-3 rounded transition-colors active:scale-98"
            >
              <Globe size={15} className="text-brand-600" />
              <span className="hidden sm:inline">{action.secondary.label}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
