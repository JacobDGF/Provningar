import { Camera, MapPin, Mail, Edit3, Check, X, GraduationCap, Users, BookMarked, Star, LogOut, HelpCircle, ChevronRight, History as HistoryIcon } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const AVATARS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=20',
  'https://i.pravatar.cc/150?img=25',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=48',
];

export function Profile() {
  const { currentUser, updateUser, savedExams, exams, posts, setActiveTab, setShowingExamDetail, setShowingFaq } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameVal, setNameVal] = useState(currentUser.name);
  const [bioVal, setBioVal] = useState(currentUser.bio);
  const [emailVal, setEmailVal] = useState(currentUser.email);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamCourse, setNewExamCourse] = useState('');
  const [newExamGrade, setNewExamGrade] = useState('A');
  const [newExamDate, setNewExamDate] = useState('');

  const myPosts = posts.filter(p => p.userId === 'me');
  const totalLikes = myPosts.reduce((sum, p) => sum + p.likes, 0);

  const addCompletedExam = () => {
    if (!newExamSubject || !newExamCourse || !newExamDate) return;
    updateUser({
      completedExams: [...currentUser.completedExams, {
        examId: `manual-${Date.now()}`,
        schoolName: 'Eget',
        subject: newExamSubject,
        course: newExamCourse,
        date: newExamDate,
        grade: newExamGrade,
      }],
    });
    setNewExamSubject('');
    setNewExamCourse('');
    setNewExamGrade('A');
    setNewExamDate('');
    setShowAddExam(false);
  };

  const resetApp = () => {
    if (window.confirm('Är du säker? All data raderas.')) {
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
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-line"
            >
              <Camera size={14} className="text-brand-600" />
            </button>
          </div>

          {/* Name */}
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                className="text-white bg-white/20 rounded-xl px-3 py-1 text-lg font-bold text-center outline-none border border-white/30"
                autoFocus
              />
              <button onClick={() => { updateUser({ name: nameVal }); setEditingName(false); }}><Check size={18} className="text-white" /></button>
              <button onClick={() => setEditingName(false)}><X size={18} className="text-white/70" /></button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-1 mb-1">
              <h2 className="text-white text-xl font-bold font-display">{currentUser.name}</h2>
              <Edit3 size={14} className="text-white/70" />
            </button>
          )}

          <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
            <MapPin size={13} />
            <span>{currentUser.location}</span>
          </div>

          <div className="flex items-center gap-1 text-white/80 text-sm mb-3">
            <Mail size={13} />
            {editingEmail ? (
              <div className="flex items-center gap-2">
                <input
                  value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  className="bg-white/20 text-white rounded-lg px-2 py-0.5 text-sm outline-none border border-white/30"
                />
                <button onClick={() => { updateUser({ email: emailVal }); setEditingEmail(false); }}><Check size={14} className="text-white" /></button>
                <button onClick={() => setEditingEmail(false)}><X size={14} className="text-white/70" /></button>
              </div>
            ) : (
              <button onClick={() => setEditingEmail(true)} className="flex items-center gap-1">
                <span>{currentUser.email}</span>
                <Edit3 size={11} className="text-white/50" />
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-6 text-center">
            <button onClick={() => setActiveTab('exams')}>
              <p className="text-white font-bold text-lg">{savedExams.length}</p>
              <p className="text-white/80 text-xs">Sparade</p>
            </button>
            <button onClick={() => setActiveTab('history')}>
              <p className="text-white font-bold text-lg">{currentUser.completedExams.length}</p>
              <p className="text-white/80 text-xs">Gjorda</p>
            </button>
            <div>
              <p className="text-white font-bold text-lg">{currentUser.following.length}</p>
              <p className="text-white/80 text-xs">Följer</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{totalLikes}</p>
              <p className="text-white/80 text-xs">Likes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 lg:pb-8 bg-cream">
        <div className="max-w-2xl mx-auto w-full">
        {/* Big FAQ button */}
        <button
          onClick={() => setShowingFaq(true)}
          className="w-[calc(100%-2rem)] lg:w-full mx-4 lg:mx-0 mt-4 flex items-center gap-3 bg-surface border border-line rounded-2xl p-4 lg:p-5 active:scale-98 transition-transform hover:border-brand-200"
        >
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-brand-200">
            <HelpCircle size={28} className="text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-ink text-lg">Vanliga frågor</p>
            <p className="text-ink-soft text-sm">Allt om prövningar, kostnad och anmälan</p>
          </div>
          <ChevronRight size={22} className="text-ink-faint" />
        </button>

        {/* Bio */}
        <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-2xl p-4 border border-line">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-ink flex items-center gap-2"><Star size={16} className="text-amber-accent" />Om mig</h3>
            <button onClick={() => setEditingBio(v => !v)}>
              <Edit3 size={15} className="text-ink-faint" />
            </button>
          </div>
          {editingBio ? (
            <div>
              <textarea
                value={bioVal}
                onChange={e => setBioVal(e.target.value)}
                className="w-full bg-sand rounded-xl px-3 py-2 text-sm text-ink outline-none resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { updateUser({ bio: bioVal }); setEditingBio(false); }}
                  className="flex-1 bg-brand-500 text-white text-sm font-semibold py-2 rounded-xl"
                >
                  Spara
                </button>
                <button
                  onClick={() => setEditingBio(false)}
                  className="flex-1 bg-sand text-ink-soft text-sm font-semibold py-2 rounded-xl"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <p className="text-ink-soft text-sm leading-relaxed">{currentUser.bio || 'Lägg till en kort beskrivning om dig själv...'}</p>
          )}
        </div>

        {/* Saved exams summary */}
        <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-2xl p-4 border border-line">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink text-lg flex items-center gap-2.5">
              <span className="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookMarked size={22} className="text-brand-600" />
              </span>
              Sparade prövningar
            </h3>
            <button onClick={() => setActiveTab('exams')} className="text-brand-600 text-xs font-bold flex items-center gap-0.5">
              Visa alla <ChevronRight size={13} />
            </button>
          </div>
          {savedExams.length === 0 ? (
            <p className="text-ink-faint text-sm">Du har inga sparade prövningar än.</p>
          ) : (
            <div className="space-y-2">
              {savedExams.slice(0, 5).map(se => {
                const exam = exams.find(e => e.id === se.examId);
                if (!exam) return null;
                return (
                  <button key={se.examId} onClick={() => setShowingExamDetail(exam.id)} className="flex items-center gap-3 w-full text-left">
                    <img src={exam.schoolImage} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{exam.course}</p>
                      <p className="text-xs text-ink-soft">
                        {exam.city} · {exam.nextPeriod.confirmed && exam.nextPeriod.examWindowStart
                          ? new Date(exam.nextPeriod.examWindowStart).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
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
        <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-2xl p-4 border border-line">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <span className="w-8 h-8 bg-trust-50 rounded-xl flex items-center justify-center">
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
                {currentUser.completedExams.slice(-4).reverse().map((ce, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      ce.grade === 'A' ? 'bg-trust-50 text-trust-700' :
                      ce.grade === 'B' || ce.grade === 'C' ? 'bg-brand-100 text-brand-700' :
                      ce.grade === 'D' || ce.grade === 'E' ? 'bg-amber-accent-50 text-amber-accent' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ce.grade || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{ce.course}</p>
                      <p className="text-xs text-ink-soft">{ce.subject} · {new Date(ce.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('history')} className="mt-3 w-full flex items-center justify-center gap-1.5 text-brand-600 text-sm font-bold py-2">
                <HistoryIcon size={15} /> Se all historik
              </button>
            </>
          )}
        </div>

        {/* Following */}
        {currentUser.following.length > 0 && (
          <div className="bg-surface mx-4 lg:mx-0 mt-3 rounded-2xl p-4 border border-line">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <Users size={16} className="text-brand-600" />
              Följer {currentUser.following.length} st
            </h3>
            <p className="text-ink-soft text-sm">Du följer {currentUser.following.length} personer i communityn.</p>
          </div>
        )}

        {/* Reset */}
        <div className="mx-4 lg:mx-0 mt-3 mb-4">
          <button
            onClick={resetApp}
            className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-semibold py-3 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Återställ appen
          </button>
        </div>
        </div>
      </div>

      {/* Avatar picker modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center" onClick={() => setShowAvatarPicker(false)}>
          <div className="bg-cream w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-6 animate-sheet-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink font-display">Välj profilbild</h2>
              <button onClick={() => setShowAvatarPicker(false)} className="w-8 h-8 bg-sand rounded-full flex items-center justify-center">
                <X size={16} className="text-ink-soft" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(url => (
                <button
                  key={url}
                  onClick={() => { updateUser({ avatar: url }); setShowAvatarPicker(false); }}
                  className={`relative rounded-2xl overflow-hidden aspect-square ${currentUser.avatar === url ? 'ring-3 ring-brand-500' : ''}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {currentUser.avatar === url && (
                    <div className="absolute inset-0 bg-brand-500/30 flex items-center justify-center">
                      <Check size={24} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add exam modal */}
      {showAddExam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center" onClick={() => setShowAddExam(false)}>
          <div className="bg-cream w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-6 animate-sheet-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink font-display">Lägg till prövning</h2>
              <button onClick={() => setShowAddExam(false)} className="w-8 h-8 bg-sand rounded-full flex items-center justify-center">
                <X size={16} className="text-ink-soft" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={newExamSubject}
                onChange={e => setNewExamSubject(e.target.value)}
                placeholder="Ämne (t.ex. Matematik)"
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input
                value={newExamCourse}
                onChange={e => setNewExamCourse(e.target.value)}
                placeholder="Kurs (t.ex. Matematik 3b)"
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input
                type="date"
                value={newExamDate}
                onChange={e => setNewExamDate(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-sm outline-none"
              />
              <div>
                <p className="text-xs text-ink-soft font-semibold mb-2">Betyg</p>
                <div className="flex gap-2">
                  {GRADE_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => setNewExamGrade(g)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                        newExamGrade === g ? 'bg-brand-500 text-white' : 'bg-surface border border-line text-ink-soft'
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
                className="w-full bg-brand-500 disabled:bg-sand disabled:text-ink-faint text-white font-bold py-4 rounded-2xl"
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
