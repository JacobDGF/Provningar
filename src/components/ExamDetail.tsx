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
  ShieldCheck,
  Navigation,
  Info,
  Map,
  ListChecks,
  Globe,
  Ban,
  CalendarX,
  CalendarPlus,
} from 'lucide-react';
import { useCallback } from 'react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';
import { hasPeriodPassed } from '../lib/examStatus';
import { StatusKey, getExamStatus } from '../lib/examStatusColor';
import { getRegistrationFlow } from '../lib/registrationFlow';
import { getProviderLinks } from '../lib/providerLinks';
import { getExamAction } from '../lib/examAction';
import { examCalendarEvents, downloadCalendar } from '../lib/calendarFile';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { SchoolCover } from './SchoolCover';

/**
 * The sentence under the status banner.
 *
 * The colour says what state the round is in; this says what to do about it.
 * Kept to one sentence each — a paragraph here is what pushed the dates,
 * the price and the two buttons below the fold on a phone.
 */
function statusExplanation(exam: Exam, key: StatusKey): string {
  switch (key) {
    case 'full':
      return `${exam.provider} har meddelat att platserna är slut. Datumen nedan gäller fortfarande — men du behöver vänta på nästa omgång.`;
    case 'closed':
      return `Datumen nedan är omgången som varit. ${exam.provider} publicerar nästa anmälningsperiod på sin egen sida — börja där.`;
    case 'closing':
      return 'Anmälan är fortfarande öppen, men stänger inom en vecka. Läs igenom stegen nedan innan du klickar vidare.';
    case 'open':
      return 'Anmälan är öppen i dag. Knapparna längst ned tar dig antingen rakt in i bokningen eller till skolans egen sida.';
    case 'upcoming':
      return 'Datumen är satta men anmälan har inte öppnat än — lägg in dem i kalendern så missar du inte dagen.';
    default:
      return `${exam.provider} har inte publicerat några datum för nästa omgång. Vi visar aldrig gissade datum — se deras egen sida innan du planerar.`;
  }
}

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
  // Before the early return: hooks can't run conditionally, and the sheet is
  // only mounted while an exam is showing anyway.
  useEscapeKey(useCallback(() => setShowingExamDetail(null), [setShowingExamDetail]));

  if (!exam) return null;

  const saved = isExamSaved(exam.id);
  const { nextPeriod } = exam;
  const status = getExamStatus(exam);
  // Nothing in a round that is over belongs in anyone's calendar.
  const passed = hasPeriodPassed(exam);
  // Amber, not red: the dates are still worth acting on. Red in this sheet
  // belongs to the banner above, and only when the round is closed to you.
  const urgent = status.tone.key === 'closing';
  const flow = getRegistrationFlow(exam);
  const links = getProviderLinks(exam);
  const action = getExamAction(exam);
  const calendarEvents = examCalendarEvents(exam);

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
          <SchoolCover exam={exam} className="w-full h-52" />
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
        <div className="overflow-y-auto flex-1">
          <div className="p-4 space-y-4">
            {/* Trust banner */}
            <div className="bg-trust-50 border border-trust-100 rounded p-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-trust-600 flex-shrink-0" />
              <p className="text-trust-700 text-xs">
                Uppgifterna kontrollerade mot {exam.provider}s webbplats{' '}
                {formatDateShort(exam.verifiedAt)}.
              </p>
            </div>

            {/* One status banner, in the palette's own colour.
                This was four separate blocks — full, closed, open, urgent —
                which could stack two deep and repeat the same fact in two
                voices. The colour comes from the same table the card's rail
                and the map's pin read, so the sheet can never disagree with
                the card the user tapped to get here. */}
            <div className={`rounded p-3 flex items-start gap-2 ${status.tone.softChip}`}>
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${status.tone.dot}`}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold">{status.label}</p>
                <p className="text-ink-soft text-xs mt-0.5 leading-relaxed">
                  {statusExplanation(exam, status.tone.key)}
                </p>
              </div>
            </div>

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
                  {!nextPeriod.applicationStart && nextPeriod.applicationEnd && (
                    <InfoRow
                      label="Sista anmälningsdag"
                      value={formatDate(nextPeriod.applicationEnd)}
                      urgent={urgent}
                    />
                  )}
                  {nextPeriod.examWindowStart && nextPeriod.examWindowEnd && (
                    <InfoRow
                      label="Provperiod"
                      value={
                        nextPeriod.examWindowStart === nextPeriod.examWindowEnd
                          ? formatDate(nextPeriod.examWindowStart)
                          : `${formatDate(nextPeriod.examWindowStart)} – ${formatDate(nextPeriod.examWindowEnd)}`
                      }
                    />
                  )}
                  {!nextPeriod.applicationEnd && !nextPeriod.examWindowStart && (
                    <InfoRow label="Anmälan" value={nextPeriod.label} />
                  )}
                  {(nextPeriod.applicationEnd || nextPeriod.examWindowStart) && (
                    <p className="text-ink-soft text-xs leading-relaxed pt-1 border-t border-line">
                      {nextPeriod.label}
                    </p>
                  )}
                  {/* The dates only help while the app is open. This puts them
                      in the calendar the user already checks. */}
                  {calendarEvents.length > 0 && !passed && (
                    <button
                      onClick={() => downloadCalendar(exam)}
                      className="w-full mt-1 flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-bold py-2.5 rounded transition-colors active:scale-98"
                    >
                      <CalendarPlus size={15} />
                      Lägg till i min kalender
                    </button>
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

            {/* How you actually book — what's left after tapping the button */}
            <div className="bg-surface rounded-md p-4 border border-line">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <ListChecks size={16} className="text-brand-600" />
                  Så anmäler du dig
                </h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    !action.live
                      ? status.tone.softChip
                      : flow.direct
                        ? 'bg-trust-50 text-trust-700'
                        : 'bg-sand text-ink-soft'
                  }`}
                >
                  {action.live ? `${flow.steps.length} steg kvar` : status.tone.shortLabel}
                </span>
              </div>
              {/* Steps are a promise about what happens after the button, and
                  on a closed round that promise doesn't hold — the form on the
                  other side opens with "anmälan är stängd". Say that instead of
                  numbering three steps nobody can take. */}
              {action.live ? (
                <>
                  <p className="text-ink-soft text-xs leading-relaxed mb-3">{flow.landing}</p>
                  <ol className="space-y-2">
                    {flow.steps.map((step, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="w-5 h-5 bg-brand-50 text-brand-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-ink text-sm leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-ink-soft text-sm leading-relaxed">
                  {action.variant === 'full'
                    ? `Det går inte att anmäla sig till den här omgången — ${exam.provider} har meddelat att platserna är slut. Anmälningssidan finns kvar, men möter dig med en stängd blankett.`
                    : `Anmälan till den här omgången är stängd. Anmälningssidan finns kvar, men tar inte emot fler anmälningar förrän ${exam.provider} öppnar nästa omgång.`}
                </p>
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

        {/* CTA — a flex sibling, not absolutely positioned: an `absolute` bar
            here resolves against the fixed backdrop, not the sheet, and gets
            clipped away entirely by the sheet's overflow on desktop. */}
        {/* Two ways out, both explicit — and which one leads is decided by the
            round's state, not by the layout. On a live round it's the verified
            deep link; on a full or closed one that link goes to a form nobody
            can submit, so the red button takes the provider's own page and the
            booking is demoted. See lib/examAction.ts. */}
        <div className="flex-shrink-0 bg-surface border-t border-line p-4 space-y-2 safe-bottom">
          <a
            href={action.primary.href}
            target="_blank"
            rel="noopener noreferrer"
            title={action.primary.title}
            className={`w-full flex items-center justify-center gap-2.5 font-bold py-4 px-4 rounded-md text-base leading-snug text-center active:scale-98 transition-transform ${
              action.variant === 'full'
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200'
                : action.variant === 'closed'
                  ? 'bg-ink-soft hover:bg-ink text-white shadow-lg'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-200'
            }`}
          >
            {action.variant === 'full' ? (
              <Ban size={18} strokeWidth={2.5} className="flex-shrink-0" />
            ) : action.variant === 'closed' ? (
              <CalendarX size={18} className="flex-shrink-0" />
            ) : (
              <ExternalLink size={18} className="flex-shrink-0" />
            )}
            <span>
              {action.live ? `${action.primary.label} hos ${exam.provider}` : action.primary.label}
            </span>
          </a>
          {action.secondary && (
            <>
              <a
                href={action.secondary.href}
                target="_blank"
                rel="noopener noreferrer"
                title={action.secondary.title}
                className="w-full flex items-center justify-center gap-2 bg-surface border border-line hover:border-brand-300 hover:bg-brand-50 text-ink font-bold py-3.5 rounded-md text-sm active:scale-98 transition-all"
              >
                <Globe size={16} className="text-brand-600" />
                {action.live
                  ? links.siteIsHomepage
                    ? `Gå till ${exam.provider}s webbplats`
                    : 'Läs mer på skolans egen sida'
                  : 'Öppna anmälningssidan ändå'}
              </a>
              <p className="text-ink-faint text-[11px] text-center leading-relaxed">
                {action.live
                  ? `${flow.direct ? 'Direkt till bokningen' : 'Så nära anmälan vi kommer'} — eller ${links.siteLabel}, om du hellre gör allt själv.`
                  : 'Avbokningar händer — men räkna inte med en plats den här omgången.'}
              </p>
            </>
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
      <span
        className={`text-sm font-semibold text-right ${urgent ? 'text-orange-700' : 'text-ink'}`}
      >
        {value}
      </span>
    </div>
  );
}
