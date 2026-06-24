import { X, MapPin, Calendar, CreditCard, Clock, BookOpen, Lightbulb, ExternalLink, Bookmark, BookmarkCheck, ChevronRight, ShieldCheck, Navigation, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { haversineDistanceKm, formatDistanceKm } from '../lib/distance';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExamDetail() {
  const { showingExamDetail, setShowingExamDetail, exams, isExamSaved, saveExam, unsaveExam, userLocation } = useStore();
  const exam = exams.find(e => e.id === showingExamDetail);

  if (!exam) return null;

  const saved = isExamSaved(exam.id);
  const { nextPeriod } = exam;
  const deadlineDate = nextPeriod.confirmed ? nextPeriod.applicationEnd : undefined;
  const deadlineDays = deadlineDate ? daysUntil(deadlineDate) : null;
  const urgent = deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0;

  const distanceKm = userLocation
    ? haversineDistanceKm(userLocation.lat, userLocation.lng, exam.lat, exam.lng)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowingExamDetail(null)}>
      <div
        className="bg-gray-50 w-full max-h-[92vh] rounded-t-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Image header */}
        <div className="relative flex-shrink-0">
          <img src={exam.schoolImage} alt={exam.schoolName} className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={() => setShowingExamDetail(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <X size={18} className="text-white" />
          </button>
          <button
            onClick={() => saved ? unsaveExam(exam.id) : saveExam(exam.id)}
            className="absolute top-4 right-16 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            {saved
              ? <BookmarkCheck size={18} className="text-yellow-400" />
              : <Bookmark size={18} className="text-white" />
            }
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white/75 text-sm">{exam.schoolName} · {exam.provider}</p>
            <h2 className="text-white text-2xl font-bold">{exam.course}</h2>
            <p className="text-blue-200 text-sm">{exam.courseCode}</p>
          </div>
        </div>

        {/* Scroll content */}
        <div className="overflow-y-auto flex-1 pb-28">
          <div className="p-4 space-y-4">

            {/* Trust banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-xs">
                Uppgifterna kontrollerade mot {exam.provider}s webbplats {formatDateShort(exam.verifiedAt)}.
              </p>
            </div>

            {/* Urgent warning */}
            {urgent && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <Clock size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-medium">
                  {deadlineDays === 0 ? 'Sista anmälningsdagen idag!' : `Bara ${deadlineDays} dagar kvar att anmäla sig!`}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-4">
              <p className="text-gray-700 text-sm leading-relaxed">{exam.description}</p>
            </div>

            {/* Key info grid */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
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
                <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
                  <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 text-sm font-medium">{nextPeriod.label}</p>
                    <p className="text-blue-700 text-xs mt-1">
                      Vi visar aldrig gissade datum. Se aktuella anmälningstider hos {exam.provider} innan du planerar din prövning.
                    </p>
                    <a
                      href={exam.infoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold mt-2"
                    >
                      Se datum hos {exam.provider} <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Practical info */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                Praktisk info
              </h3>
              <div className="space-y-2.5">
                <InfoRow label="Pris" value={exam.priceNote ? `${exam.price} kr · ${exam.priceNote}` : `${exam.price} kr`} />
                <InfoRow label="Anordnare" value={exam.provider} icon={<ShieldCheck size={14} className="text-gray-400" />} />
                <InfoRow label="Ort" value={exam.city} icon={<MapPin size={14} className="text-gray-400" />} />
                <InfoRow label="Adress" value={exam.address} />
                {distanceKm !== null && (
                  <InfoRow label="Avstånd från dig" value={formatDistanceKm(distanceKm)} icon={<Navigation size={14} className="text-gray-400" />} />
                )}
                <InfoRow label="Region" value={exam.region} />
                <InfoRow label="Nivå" value={exam.level} />
              </div>
            </div>

            {/* Exam components */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Provmoment
              </h3>
              <div className="space-y-3">
                {exam.components.map((c, i) => (
                  <div key={i} className="border-l-2 border-blue-200 pl-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-800">{c.name}</p>
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={11} />
                        {c.duration}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Study tips */}
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-yellow-500" />
                Studietips
              </h3>
              <div className="space-y-2">
                {exam.studyTips.map((tip, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="w-5 h-5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {exam.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 space-y-2">
          <a
            href={exam.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-2xl text-base shadow-lg shadow-blue-200"
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
              className="w-full flex items-center justify-center gap-1.5 text-gray-500 text-xs font-medium py-1"
            >
              Mer information på skolans webbplats <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, urgent, icon }: { label: string; value: string; urgent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-sm flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-semibold text-right ${urgent ? 'text-red-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
