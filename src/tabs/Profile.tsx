import {
  Camera,
  MapPin,
  Mail,
  Edit3,
  Check,
  X,
  GraduationCap,
  Users,
  BookMarked,
  Star,
  LogOut,
  HelpCircle,
  ChevronRight,
  History as HistoryIcon,
  ImagePlus,
  Trash2,
  CalendarClock,
  TrendingUp,
  Download,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { SchoolCover } from '../components/SchoolCover';
import { Avatar } from '../components/Avatar';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { fileToAvatarDataUrl } from '../lib/avatar';
import { summarizeGrades, gradeChipClass } from '../lib/grades';
import { daysUntil, isFullyBooked } from '../lib/examStatus';

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function Profile() {
  const {
    currentUser,
    updateUser,
    savedExams,
    exams,
    posts,
    setActiveTab,
    setShowingExamDetail,
    setShowingFaq,
  } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [nameVal, setNameVal] = useState(currentUser.name);
  const [bioVal, setBioVal] = useState(currentUser.bio);
  const [emailVal, setEmailVal] = useState(currentUser.email);
  const [locationVal, setLocationVal] = useState(currentUser.location);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamCourse, setNewExamCourse] = useState('');
  const [newExamGrade, setNewExamGrade] = useState('A');
  const [newExamDate, setNewExamDate] = useState('');

  // Two inputs rather than one: `capture` opens the camera straight away on a
  // phone, which is wrong when the photo you want is already in your library.
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  useEscapeKey(
    useCallback(() => {
      setShowPhotoSheet(false);
      setShowAddExam(false);
    }, []),
    showPhotoSheet || showAddExam,
  );

  const myPosts = posts.filter((p) => p.userId === 'me');
  const totalLikes = myPosts.reduce((sum, p) => sum + p.likes, 0);
  const grades = summarizeGrades(currentUser.completedExams);

  /** Soonest confirmed deadline among the exams the user saved — the one thing
      on this screen that can actually cost them a term if they miss it. */
  const nextDeadline = savedExams
    .map((se) => exams.find((e) => e.id === se.examId))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .map((exam) => ({
      exam,
      days: exam.nextPeriod.applicationEnd ? daysUntil(exam.nextPeriod.applicationEnd) : null,
    }))
    // A full round has a deadline you cannot act on, so it isn't the one to
    // put at the top of the profile.
    .filter(
      (d) =>
        d.exam.nextPeriod.confirmed && !isFullyBooked(d.exam) && d.days !== null && d.days >= 0,
    )
    .sort((a, b) => (a.days as number) - (b.days as number))[0];

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Filen är inte en bild. Välj en bild eller ta ett foto.');
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      updateUser({ avatar: dataUrl });
      setShowPhotoSheet(false);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Bilden kunde inte läsas.');
    }
  };

  const addCompletedExam = () => {
    if (!newExamSubject || !newExamCourse || !newExamDate) return;
    updateUser({
      completedExams: [
        ...currentUser.completedExams,
        {
          examId: `manual-${Date.now()}`,
          schoolName: 'Eget',
          subject: newExamSubject,
          course: newExamCourse,
          date: newExamDate,
          grade: newExamGrade,
        },
      ],
    });
    setNewExamSubject('');
    setNewExamCourse('');
    setNewExamGrade('A');
    setNewExamDate('');
    setShowAddExam(false);
  };

  /**
   * Everything in this app lives in one browser's localStorage: clear the site
   * data, switch phone, or hit "Återställ appen" and the saved prövningar,
   * grades and posts are gone with no server-side copy to restore from. An
   * export is the only backup that exists, so it sits right next to the button
   * that destroys the original.
   */
  const exportData = () => {
    const payload = {
      exporteradFrån: 'Hitta prövningar',
      exporteradDen: new Date().toISOString(),
      profil: currentUser,
      sparadePrövningar: savedExams,
      minaInlägg: myPosts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `provningar-mina-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const resetApp = () => {
    if (
      window.confirm(
        'Är du säker? Sparade prövningar, betyg och inlägg raderas från den här enheten och går ' +
          'inte att få tillbaka. Exportera dina data först om du vill ha en kopia.',
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-b from-brand-600 to-brand-500 px-4 lg:px-8 pt-14 lg:pt-8 pb-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto">
          {/* Avatar */}
          <div className="relative mb-3">
            <Avatar
              name={currentUser.name}
              src={currentUser.avatar}
              seed="me"
              size={96}
              className="border-4 border-white shadow-lg"
            />
            <button
              onClick={() => {
                setPhotoError(null);
                setShowPhotoSheet(true);
              }}
              aria-label={currentUser.avatar ? 'Byt profilbild' : 'Lägg till profilbild'}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-line active:scale-90 transition-transform"
            >
              <Camera size={14} className="text-brand-600" />
            </button>
          </div>

          {/* Name */}
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                aria-label="Ditt namn"
                className="text-white bg-white/20 rounded px-3 py-1 text-lg font-bold text-center outline-none border border-white/30"
                // eslint-disable-next-line jsx-a11y/no-autofocus -- user just tapped "edit name" to reveal this field
                autoFocus
              />
              <button
                onClick={() => {
                  updateUser({ name: nameVal.trim() || currentUser.name });
                  setEditingName(false);
                }}
                aria-label="Spara namn"
              >
                <Check size={18} className="text-white" />
              </button>
              <button onClick={() => setEditingName(false)} aria-label="Avbryt">
                <X size={18} className="text-white/70" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-1 mb-1">
              <h2 className="text-white text-xl font-bold font-display">{currentUser.name}</h2>
              <Edit3 size={14} className="text-white/70" />
            </button>
          )}

          <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
            <MapPin size={13} />
            {editingLocation ? (
              <div className="flex items-center gap-2">
                <input
                  value={locationVal}
                  onChange={(e) => setLocationVal(e.target.value)}
                  aria-label="Din ort"
                  className="bg-white/20 text-white rounded-lg px-2 py-0.5 text-sm outline-none border border-white/30"
                />
                <button
                  onClick={() => {
                    updateUser({ location: locationVal.trim() || currentUser.location });
                    setEditingLocation(false);
                  }}
                  aria-label="Spara ort"
                >
                  <Check size={14} className="text-white" />
                </button>
                <button onClick={() => setEditingLocation(false)} aria-label="Avbryt">
                  <X size={14} className="text-white/70" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingLocation(true)} className="flex items-center gap-1">
                <span>{currentUser.location}</span>
                <Edit3 size={11} className="text-white/50" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-white/80 text-sm mb-3">
            <Mail size={13} />
            {editingEmail ? (
              <div className="flex items-center gap-2">
                <input
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  type="email"
                  aria-label="Din e-postadress"
                  className="bg-white/20 text-white rounded-lg px-2 py-0.5 text-sm outline-none border border-white/30"
                />
                <button
                  onClick={() => {
                    updateUser({ email: emailVal.trim() || currentUser.email });
                    setEditingEmail(false);
                  }}
                  aria-label="Spara e-postadress"
                >
                  <Check size={14} className="text-white" />
                </button>
                <button onClick={() => setEditingEmail(false)} aria-label="Avbryt">
                  <X size={14} className="text-white/70" />
                </button>
              </div>
            ) : (
              <button onClick={() => setEditingEmail(true)} className="flex items-center gap-1">
                <span>{currentUser.email}</span>
                <Edit3 size={11} className="text-white/50" />
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 w-full max-w-md text-center">
            <button
              onClick={() => setActiveTab('exams')}
              className="rounded-md py-1 hover:bg-white/10 transition-colors"
            >
              <p className="text-white font-bold text-lg">{savedExams.length}</p>
              <p className="text-white/80 text-xs">Sparade</p>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="rounded-md py-1 hover:bg-white/10 transition-colors"
            >
              <p className="text-white font-bold text-lg">{currentUser.completedExams.length}</p>
              <p className="text-white/80 text-xs">Gjorda</p>
            </button>
            <div className="py-1">
              <p className="text-white font-bold text-lg">
                {grades.average !== null ? grades.average.toString().replace('.', ',') : '–'}
              </p>
              <p className="text-white/80 text-xs">Snittpoäng</p>
            </div>
            <button
              onClick={() => setActiveTab('community')}
              className="rounded-md py-1 hover:bg-white/10 transition-colors"
            >
              <p className="text-white font-bold text-lg">{totalLikes}</p>
              <p className="text-white/80 text-xs">Likes</p>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 lg:pb-8 bg-cream">
        <div className="max-w-2xl mx-auto w-full">
          {/* Next deadline — the one thing here that expires */}
          {nextDeadline && (
            <button
              onClick={() => setShowingExamDetail(nextDeadline.exam.id)}
              className={`w-[calc(100%-2rem)] lg:w-full mx-4 lg:mx-0 mt-4 flex items-center gap-3 rounded-md p-4 text-left border transition-transform active:scale-98 ${
                (nextDeadline.days as number) <= 7
                  ? 'bg-red-50 border-red-200'
                  : 'bg-surface border-line hover:border-brand-200'
              }`}
            >
              <span
                className={`w-11 h-11 rounded flex items-center justify-center flex-shrink-0 ${
                  (nextDeadline.days as number) <= 7 ? 'bg-red-100' : 'bg-brand-100'
                }`}
              >
                <CalendarClock
                  size={22}
                  className={(nextDeadline.days as number) <= 7 ? 'text-red-600' : 'text-brand-600'}
                />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-soft">Närmaste anmälningsdeadline</p>
                <p className="font-bold text-ink truncate">{nextDeadline.exam.course}</p>
                <p
                  className={`text-sm font-semibold ${
                    (nextDeadline.days as number) <= 7 ? 'text-red-600' : 'text-ink-soft'
                  }`}
                >
                  {nextDeadline.days === 0
                    ? 'Sista anmälningsdagen är idag'
                    : `${nextDeadline.days} dagar kvar · ${nextDeadline.exam.city}`}
                </p>
              </div>
              <ChevronRight size={20} className="text-ink-faint" />
            </button>
          )}

          {/* Big FAQ button */}
          <button
            onClick={() => setShowingFaq(true)}
            className="w-[calc(100%-2rem)] lg:w-full mx-4 lg:mx-0 mt-3 flex items-center gap-3 bg-surface border border-line rounded-md p-4 lg:p-5 active:scale-98 transition-transform hover:border-brand-200"
          >
            <div className="w-14 h-14 bg-brand-500 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-200">
              <HelpCircle size={28} className="text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-ink text-lg">Vanliga frågor</p>
              <p className="text-ink-soft text-sm">Allt om prövningar, kostnad och anmälan</p>
            </div>
            <ChevronRight size={22} className="text-ink-faint" />
          </button>

          {/* Bio */}
          <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-md p-4 border border-line">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-ink flex items-center gap-2">
                <Star size={16} className="text-amber-accent" />
                Om mig
              </h3>
              <button onClick={() => setEditingBio((v) => !v)} aria-label="Redigera beskrivning">
                <Edit3 size={15} className="text-ink-faint" />
              </button>
            </div>
            {editingBio ? (
              <div>
                <textarea
                  value={bioVal}
                  onChange={(e) => setBioVal(e.target.value)}
                  aria-label="Beskrivning"
                  className="w-full bg-sand rounded px-3 py-2 text-sm text-ink outline-none resize-none min-h-[80px]"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- user just tapped "edit bio" to reveal this field
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      updateUser({ bio: bioVal });
                      setEditingBio(false);
                    }}
                    className="flex-1 bg-brand-500 text-white text-sm font-semibold py-2 rounded"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditingBio(false)}
                    className="flex-1 bg-sand text-ink-soft text-sm font-semibold py-2 rounded"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-ink-soft text-sm leading-relaxed">
                {currentUser.bio || 'Lägg till en kort beskrivning om dig själv...'}
              </p>
            )}
          </div>

          {/* Result summary — only once there's something to summarize */}
          {grades.graded > 0 && (
            <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-md p-4 border border-line">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-trust-600" />
                Dina resultat
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-cream rounded p-3">
                  <p className="text-2xl font-bold text-ink font-display">
                    {grades.average?.toString().replace('.', ',')}
                  </p>
                  <p className="text-ink-soft text-xs mt-0.5">Snittpoäng</p>
                </div>
                <div className="bg-cream rounded p-3">
                  <p className="text-2xl font-bold text-trust-700 font-display">{grades.passed}</p>
                  <p className="text-ink-soft text-xs mt-0.5">Godkända</p>
                </div>
                <div className="bg-cream rounded p-3">
                  <p className="text-2xl font-bold text-ink font-display">{grades.graded}</p>
                  <p className="text-ink-soft text-xs mt-0.5">Med betyg</p>
                </div>
              </div>
              <p className="text-ink-faint text-xs mt-3 leading-relaxed">
                Snittpoängen räknas som meritvärde (A = 20, E = 10). Prövningar du lagt in utan
                betyg räknas inte med.
              </p>
            </div>
          )}

          {/* Saved exams summary */}
          <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-md p-4 border border-line">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink text-lg flex items-center gap-2.5">
                <span className="w-11 h-11 bg-brand-100 rounded flex items-center justify-center flex-shrink-0">
                  <BookMarked size={22} className="text-brand-600" />
                </span>
                Sparade prövningar
              </h3>
              <button
                onClick={() => setActiveTab('exams')}
                className="text-brand-600 text-xs font-bold flex items-center gap-0.5"
              >
                Visa alla <ChevronRight size={13} />
              </button>
            </div>
            {savedExams.length === 0 ? (
              <div>
                <p className="text-ink-faint text-sm">Du har inga sparade prövningar än.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-3 inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-4 py-2.5 rounded transition-colors"
                >
                  Hitta en prövning <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {savedExams.slice(0, 5).map((se) => {
                  const exam = exams.find((e) => e.id === se.examId);
                  if (!exam) return null;
                  return (
                    <button
                      key={se.examId}
                      onClick={() => setShowingExamDetail(exam.id)}
                      className="flex items-center gap-3 w-full text-left"
                    >
                      <SchoolCover exam={exam} className="w-10 h-10 rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{exam.course}</p>
                        <p className="text-xs text-ink-soft">
                          {exam.city} ·{' '}
                          {exam.nextPeriod.confirmed && exam.nextPeriod.examWindowStart
                            ? new Date(exam.nextPeriod.examWindowStart).toLocaleDateString(
                                'sv-SE',
                                { day: 'numeric', month: 'short' },
                              )
                            : 'Datum ej fastställt'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-ink-faint" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed exams */}
          <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-md p-4 border border-line">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink flex items-center gap-2">
                <span className="w-8 h-8 bg-trust-50 rounded flex items-center justify-center">
                  <GraduationCap size={17} className="text-trust-600" />
                </span>
                Genomförda prövningar
              </h3>
              <button
                onClick={() => setShowAddExam(true)}
                className="text-brand-600 text-xs font-bold bg-brand-50 px-3 py-1.5 rounded-full"
              >
                + Lägg till
              </button>
            </div>
            {currentUser.completedExams.length === 0 ? (
              <p className="text-ink-faint text-sm">Inga genomförda prövningar registrerade.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {currentUser.completedExams
                    .slice(-4)
                    .reverse()
                    .map((ce, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2 border-b border-line last:border-0"
                      >
                        <div
                          className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg flex-shrink-0 ${gradeChipClass(ce.grade)}`}
                        >
                          {ce.grade || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{ce.course}</p>
                          <p className="text-xs text-ink-soft">
                            {ce.subject} ·{' '}
                            {new Date(ce.date).toLocaleDateString('sv-SE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-brand-600 text-sm font-bold py-2"
                >
                  <HistoryIcon size={15} /> Se all historik
                </button>
              </>
            )}
          </div>

          {/* Following */}
          {currentUser.following.length > 0 && (
            <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-md p-4 border border-line">
              <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
                <Users size={16} className="text-brand-600" />
                Följer {currentUser.following.length} st
              </h3>
              <p className="text-ink-soft text-sm">
                Du följer {currentUser.following.length} personer i communityn.
              </p>
            </div>
          )}

          {/* Where the data lives — the app keeps everything on-device */}
          <p className="text-ink-faint text-xs leading-relaxed mx-4 lg:mx-0 mt-4">
            Allt du fyller i här — namn, bild, sparade prövningar — sparas bara i den här
            webbläsaren. Ingenting skickas till någon server, och appen tar aldrig emot din anmälan:
            den görs alltid hos skolan.
          </p>

          {/* Your data — export sits above reset on purpose: the backup should
              be the thing you see first, not an afterthought next to the wipe. */}
          <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-md p-4 border border-line">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <Download size={16} className="text-brand-600" />
              Dina data
            </h3>
            <p className="text-ink-soft text-sm leading-relaxed mb-3">
              Allt du sparar ligger bara i den här webbläsaren — inget skickas någonstans. Byter du
              telefon eller rensar webbläsaren försvinner det, så ta en kopia först.
            </p>
            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-bold py-3 rounded transition-colors active:scale-98"
            >
              <Download size={15} />
              Exportera mina data (JSON)
            </button>
          </div>

          {/* Reset */}
          <div className="mx-4 lg:mx-0 mt-3 mb-4">
            <button
              onClick={resetApp}
              className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-semibold py-3 rounded-md border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Återställ appen
            </button>
          </div>
        </div>
      </div>

      {/* Photo sheet — a photo you take or pick, never a stock portrait */}
      {showPhotoSheet && (
        // Backdrop closes on click as a mouse convenience; the sheet has its own
        // keyboard-reachable close button below, so this isn't the only way out.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
          onClick={() => setShowPhotoSheet(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stops the backdrop's close-on-click from firing when interacting with the sheet itself */}
          <div
            className="bg-cream w-full lg:max-w-md rounded-t-lg lg:rounded-lg p-6 animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-ink font-display">Profilbild</h2>
              <button
                onClick={() => setShowPhotoSheet(false)}
                aria-label="Stäng"
                className="w-8 h-8 bg-sand rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-ink-soft" />
              </button>
            </div>
            <p className="text-ink-soft text-sm leading-relaxed mb-4">
              Använd en bild du tar eller väljer själv. Bilden stannar i den här webbläsaren och
              laddas aldrig upp någonstans.
            </p>

            <div className="flex items-center gap-4 mb-4">
              <Avatar name={currentUser.name} src={currentUser.avatar} seed="me" size={64} />
              <p className="text-ink-soft text-sm">
                {currentUser.avatar
                  ? 'Din nuvarande bild.'
                  : 'Utan bild visas dina initialer — det är helt okej att lämna det så.'}
              </p>
            </div>

            {photoError && (
              <p className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-3">
                {photoError}
              </p>
            )}

            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                void pickPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={libraryInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void pickPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            <div className="space-y-2">
              <button
                onClick={() => cameraInput.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-md transition-colors active:scale-98"
              >
                <Camera size={18} /> Ta ett foto
              </button>
              <button
                onClick={() => libraryInput.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-surface border border-line hover:border-brand-300 text-ink font-bold py-3.5 rounded-md transition-colors active:scale-98"
              >
                <ImagePlus size={18} className="text-brand-600" /> Välj en bild
              </button>
              {currentUser.avatar && (
                <button
                  onClick={() => {
                    updateUser({ avatar: '' });
                    setShowPhotoSheet(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-red-500 font-semibold py-3 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} /> Ta bort bilden
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add exam modal */}
      {showAddExam && (
        // Backdrop closes on click as a mouse convenience; the sheet has its own
        // keyboard-reachable close button below, so this isn't the only way out.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center"
          onClick={() => setShowAddExam(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- stops the backdrop's close-on-click from firing when interacting with the sheet itself */}
          <div
            className="bg-cream w-full lg:max-w-md rounded-t-lg lg:rounded-lg p-6 animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink font-display">Lägg till prövning</h2>
              <button
                onClick={() => setShowAddExam(false)}
                aria-label="Stäng"
                className="w-8 h-8 bg-sand rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-ink-soft" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={newExamSubject}
                onChange={(e) => setNewExamSubject(e.target.value)}
                placeholder="Ämne (t.ex. Matematik)"
                aria-label="Ämne"
                className="w-full bg-surface border border-line rounded px-4 py-3 text-sm outline-none"
              />
              <input
                value={newExamCourse}
                onChange={(e) => setNewExamCourse(e.target.value)}
                placeholder="Kurs (t.ex. Matematik 3b)"
                aria-label="Kurs"
                className="w-full bg-surface border border-line rounded px-4 py-3 text-sm outline-none"
              />
              <input
                type="date"
                value={newExamDate}
                onChange={(e) => setNewExamDate(e.target.value)}
                aria-label="Datum"
                className="w-full bg-surface border border-line rounded px-4 py-3 text-sm outline-none"
              />
              <div>
                <p className="text-xs text-ink-soft font-semibold mb-2">Betyg</p>
                <div className="flex gap-2">
                  {GRADE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setNewExamGrade(g)}
                      className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${
                        newExamGrade === g
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface border border-line text-ink-soft'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={addCompletedExam}
                disabled={!newExamSubject || !newExamCourse || !newExamDate}
                className="w-full bg-brand-500 disabled:bg-sand disabled:text-ink-faint text-white font-bold py-4 rounded-md"
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
