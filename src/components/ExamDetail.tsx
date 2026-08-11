import {
  X,
  MapPin,
  Calendar,
  CreditCard,
  Clock,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ShieldCheck,
  Navigation,
  Info,
  Map,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';
import { isOpenForRegistration, daysUntil } from '../lib/examStatus';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ExamDetail() {
  const {
    showingExamDetail,
    setShowingExamDetail,
    exams,
    isExamSaved,
    saveExam,
    unsaveExam,
    userLocation,
  } = useStore();
  const exam = exams.find((e) => e.id === showingExamDetail);

  if (!exam) return null;

  const saved = isExamSaved(exam.id);
  const { nextPeriod } = exam;
  const deadlineDate = nextPeriod.confirmed ? nextPeriod.applicationEnd : undefined;
  const deadlineDays = deadlineDate ? daysUntil(deadlineDate) : null;
  const urgent = deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0;
  const openNow = isOpenForRegistration(exam);

  const distanceKm = userLocation
    ? haversineDistanceKm(userLocation.lat, userLocation.lng, exam.lat, exam.lng)
    : null;

  const { lat, lng } = exam;
  // Keyless embedded map (OpenStreetMap). To use Google tiles instead, drop a
  // Google Maps Embed API key in below and swap the iframe src.
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.007},${lng + 0.012},${lat + 0.007}&layer=mapnik&marker=${lat},${lng}`;
  const gmapsView = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const gmapsDir = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    // Backdrop closes on click as a mouse convenience; the sheet has its own
    // keyboard-reachable close button below, so this isn't the only way out.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
      onClick={() => setShowingExamDetail(null)}
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stops the backdrop's close-on-click from firing when interacting with the sheet itself */}
      <div
        className="bg-cream w-full lg:max-w-2xl max-h-[92vh] lg:max-h-[88vh] rounded-t-lg lg:rounded-lg overflow-hidden flex flex-col animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image header */}
        <div className="relative flex-shrink-0">
          <img src={exam.schoolImage} alt={exam.schoolName} className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <button
            onClick={() => setShowingExamDetail(null)}
            aria-label="Stäng"
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90"
          >
            <X size={18} className="text-white" />
          </button>
          <button
            onClick={() => (saved ? unsaveExam(exam.id) : saveExam(exam.id))}
            aria-label={saved ? 'Ta bort från sparade' : 'Spara prövning'}
            className="absolute top-4 right-16 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90"
          >
            {saved ? (
              <BookmarkCheck size={18} className="text-brand-300" />
            ) : (
              <Bookmark size={18} className="text-white" />
            )}
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/80 text-sm">
              {exam.schoolName} · {exam.provider}
            </p>
            <h2 className="text-white text-2xl font-bold font-display">{exam.course}</h2>
            <p className="text-brand-200 text-sm">{exam.courseCode}</p>
          </div>
        </div>

        {/* Scroll content */}
        <div className="overflow-y-auto flex-1 pb-28">
          <div className="p-4 space-y-4">
            {/* Trust banner */}
            <div className="bg-trust-50 border border-trust-100 rounded p-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-trust-600 flex-shrink-0" />
              <p className="text-trust-700 text-xs">
                Uppgifterna kontrollerade mot {exam.provider}s webbplats{' '}
                {formatDateShort(exam.verifiedAt)}.
              </p>
            </div>

            {/* Open for registration now */}
            {openNow && (
              <div className="bg-trust-50 border border-trust-100 rounded p-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trust-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-trust-600" />
                </span>
                <p className="text-trust-700 text-sm font-semibold">Öppen för anmälan just nu</p>
              </div>
            )}

            {/* Urgent warning */}
            {urgent && (
              <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
                <Clock size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-semibold">
                  {deadlineDays === 0
                    ? 'Sista anmälningsdagen idag!'
                    : `Bara ${deadlineDays} dagar kvar att anmäla sig!`}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="bg-surface rounded-md p-4 border border-line">
              <p className="text-ink-soft text-sm leading-relaxed">{exam.description}</p>
            </div>

            {/* Dates */}
            <div className="bg-surface rounded-md p-4 border border-line">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-brand-600" />
                Viktiga datum
              </h3>
              {nextPeriod.confirmed ? (
                <div className="space-y-2.5">
                  {nextPeriod.applicationStart && nextPeriod.applicationEnd && (
                    <InfoRow
                      label="Ansökningsperiod"
                      value={`${formatDate(nextPeriod.applicationStart)} – ${formatDate(nextPeriod.applicationEnd)}`}
                      urgent={urgent}
                    />
                  )}
                  {nextPeriod.examWindowStart && nextPeriod.examWindowEnd && (
                    <InfoRow
                      label="Provperiod"
                      value={`${formatDate(nextPeriod.examWindowStart)} – ${formatDate(nextPeriod.examWindowEnd)}`}
                    />
                  )}
                  {!nextPeriod.applicationStart && !nextPeriod.examWindowStart && (
                    <InfoRow label="Anmälan" value={nextPeriod.label} />
                  )}
                </div>
              ) : (
                <div className="bg-brand-50 rounded p-3 flex items-start gap-2">
                  <Info size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ink text-sm font-semibold">{nextPeriod.label}</p>
                    <p className="text-ink-soft text-xs mt-1">
                      Vi visar aldrig gissade datum. Se aktuella anmälningstider hos {exam.provider}{' '}
                      innan du planerar din prövning.
                    </p>
                    <a
                      href={exam.infoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 text-xs font-bold mt-2"
                    >
                      Se datum hos {exam.provider} <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Practical info */}
            <div className="bg-surface rounded-md p-4 border border-line">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-brand-600" />
                Praktisk info
              </h3>
              <div className="space-y-2.5">
                <InfoRow
                  label="Pris"
                  value={
                    exam.priceNote ? `${exam.price} kr · ${exam.priceNote}` : `${exam.price} kr`
                  }
                />
                <InfoRow
                  label="Anordnare"
                  value={exam.provider}
                  icon={<ShieldCheck size={14} className="text-ink-faint" />}
                />
                <InfoRow
                  label="Ort"
                  value={exam.city}
                  icon={<MapPin size={14} className="text-ink-faint" />}
                />
                <InfoRow label="Adress" value={exam.address} />
                {distanceKm !== null && (
                  <InfoRow
                    label="Avstånd från dig"
                    value={formatDistanceKm(distanceKm)}
                    icon={<Navigation size={14} className="text-ink-faint" />}
                  />
                )}
                <InfoRow label="Region" value={exam.region} />
                <InfoRow label="Nivå" value={exam.level} />
              </div>
            </div>

            {/* Map — "Hitta hit" */}
            <div className="bg-surface rounded-md overflow-hidden border border-line">
              <h3 className="font-bold text-ink text-base px-4 pt-4 pb-3 flex items-center gap-2.5">
                <span className="w-8 h-8 bg-brand-100 rounded flex items-center justify-center flex-shrink-0">
                  <Map size={18} className="text-brand-600" />
                </span>
                Hitta hit
              </h3>
              <div className="relative h-52 lg:h-80 bg-sand">
                <iframe
                  title={`Karta – ${exam.schoolName}`}
                  src={osmSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <a
                  href={gmapsDir}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-brand-500 text-white text-sm font-bold py-3 rounded active:scale-98 transition-transform hover:bg-brand-600"
                >
                  <Navigation size={15} /> Vägbeskrivning
                </a>
                <a
                  href={gmapsView}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-sand text-ink text-sm font-bold py-3 rounded active:scale-98 transition-transform hover:bg-line"
                >
                  <Map size={15} /> Google Maps
                </a>
              </div>
            </div>

            {/* Exam components */}
            <div className="bg-surface rounded-md p-4 border border-line">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-brand-600" />
                Provmoment
              </h3>
              <div className="space-y-3">
                {exam.components.map((c, i) => (
                  <div key={i} className="border-l-2 border-brand-200 pl-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-ink">{c.name}</p>
                      <span className="bg-brand-50 text-brand-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={11} />
                        {c.duration}
                      </span>
                    </div>
                    <p className="text-ink-soft text-xs mt-0.5 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Study tips */}
            <div className="bg-surface rounded-md p-4 border border-line">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-accent" />
                Studietips
              </h3>
              <div className="space-y-2">
                {exam.studyTips.map((tip, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="w-5 h-5 bg-amber-accent-50 text-amber-accent rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-ink-soft text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {exam.tags.map((tag) => (
                <span key={tag} className="bg-sand text-ink-soft text-xs px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-line p-4 space-y-2">
          <a
            href={exam.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-md text-base shadow-lg shadow-brand-200 active:scale-98 transition-transform"
          >
            <ExternalLink size={18} />
            Gå till anmälan hos {exam.provider}
            <ChevronRight size={18} />
          </a>
          {exam.infoUrl !== exam.registrationUrl && (
            <a
              href={exam.infoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 text-ink-soft text-xs font-medium py-1"
            >
              Mer information på skolans webbplats <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  urgent,
  icon,
}: {
  label: string;
  value: string;
  urgent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-soft text-sm flex items-center gap-1.5 flex-shrink-0">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-semibold text-right ${urgent ? 'text-red-600' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}
