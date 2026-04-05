import { MapPin, Calendar, Tag, Bookmark, BookmarkCheck, ExternalLink, Clock, Users } from 'lucide-react';
import { Exam } from '../types';
import { useStore } from '../store/useStore';

interface ExamCardProps {
  exam: Exam;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  interested: 'bg-yellow-100 text-yellow-700',
  registered: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
  passed: 'bg-green-100 text-green-700',
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

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExamCard({ exam, compact }: ExamCardProps) {
  const { isExamSaved, saveExam, unsaveExam, savedExams, setShowingExamDetail, setActiveTab } = useStore();
  const saved = isExamSaved(exam.id);
  const savedExam = savedExams.find(e => e.examId === exam.id);
  const deadlineDays = daysUntil(exam.applicationDeadline);
  const urgent = deadlineDays <= 7 && deadlineDays >= 0;

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    saved ? unsaveExam(exam.id) : saveExam(exam.id);
  };

  const handleOpen = () => {
    setShowingExamDetail(exam.id);
    setActiveTab('discover');
  };

  return (
    <div
      onClick={handleOpen}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-98 transition-transform cursor-pointer"
    >
      {/* Image */}
      <div className="relative">
        <img
          src={exam.schoolImage}
          alt={exam.schoolName}
          className={`w-full object-cover ${compact ? 'h-36' : 'h-48'}`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Save button */}
        <button
          onClick={handleToggleSave}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
        >
          {saved
            ? <BookmarkCheck size={18} className="text-blue-600" />
            : <Bookmark size={18} className="text-gray-600" />
          }
        </button>

        {/* Urgent badge */}
        {urgent && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Clock size={11} />
            {deadlineDays === 0 ? 'Sista dag!' : `${deadlineDays}d kvar`}
          </div>
        )}

        {/* Status badge on saved exams */}
        {savedExam && (
          <div className={`absolute top-3 ${urgent ? 'left-24' : 'left-3'} text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[savedExam.status]}`}>
            {STATUS_LABELS[savedExam.status]}
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white/80 text-xs font-medium">{exam.schoolName}</p>
          <h3 className="text-white font-bold text-base leading-tight">{exam.course}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Tag size={11} />
            {exam.subject}
          </span>
          <span className="bg-gray-50 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin size={11} />
            {exam.city}
          </span>
          {exam.availableSpots && exam.availableSpots < 15 && (
            <span className="bg-orange-50 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <Users size={11} />
              {exam.availableSpots} platser kvar
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-gray-400 text-xs">Anmälningsstopp</p>
            <p className={`text-sm font-semibold ${urgent ? 'text-red-600' : 'text-gray-800'}`}>
              {formatDate(exam.applicationDeadline)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Provdag</p>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
              <Calendar size={13} className="text-blue-500" />
              {formatDate(exam.examDate)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Pris</p>
            <p className="text-sm font-semibold text-gray-800">{exam.price} kr</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Resultat</p>
            <p className="text-sm font-semibold text-gray-800">{formatDate(exam.resultDate)}</p>
          </div>
        </div>

        <a
          href={exam.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <ExternalLink size={15} />
          Anmäl dig
        </a>
      </div>
    </div>
  );
}
