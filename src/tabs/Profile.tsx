import { Camera, MapPin, Mail, Edit3, Check, X, GraduationCap, Users, BookOpen, Star, LogOut } from 'lucide-react';
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
  const { currentUser, updateUser, savedExams, exams, posts } = useStore();
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
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 px-4 pt-14 pb-6">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100"
            >
              <Camera size={14} className="text-blue-600" />
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
              <h2 className="text-white text-xl font-bold">{currentUser.name}</h2>
              <Edit3 size={14} className="text-white/70" />
            </button>
          )}

          <div className="flex items-center gap-1 text-blue-100 text-sm mb-1">
            <MapPin size={13} />
            <span>{currentUser.location}</span>
          </div>

          <div className="flex items-center gap-1 text-blue-100 text-sm mb-3">
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
            <div>
              <p className="text-white font-bold text-lg">{savedExams.length}</p>
              <p className="text-blue-100 text-xs">Sparade</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{currentUser.completedExams.length}</p>
              <p className="text-blue-100 text-xs">Gjorda</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{currentUser.following.length}</p>
              <p className="text-blue-100 text-xs">Följer</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{totalLikes}</p>
              <p className="text-blue-100 text-xs">Likes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 bg-gray-50">
        {/* Bio */}
        <div className="bg-white mx-4 mt-4 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Star size={15} className="text-yellow-500" />Om mig</h3>
            <button onClick={() => setEditingBio(v => !v)}>
              <Edit3 size={15} className="text-gray-400" />
            </button>
          </div>
          {editingBio ? (
            <div>
              <textarea
                value={bioVal}
                onChange={e => setBioVal(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { updateUser({ bio: bioVal }); setEditingBio(false); }}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-xl"
                >
                  Spara
                </button>
                <button
                  onClick={() => setEditingBio(false)}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-xl"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-sm leading-relaxed">{currentUser.bio || 'Lägg till en kort beskrivning om dig själv...'}</p>
          )}
        </div>

        {/* Saved exams summary */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen size={15} className="text-blue-600" />
            Sparade prövningar
          </h3>
          {savedExams.length === 0 ? (
            <p className="text-gray-400 text-sm">Du har inga sparade prövningar än.</p>
          ) : (
            <div className="space-y-2">
              {savedExams.slice(0, 5).map(se => {
                const exam = exams.find(e => e.id === se.examId);
                if (!exam) return null;
                return (
                  <div key={se.examId} className="flex items-center gap-3">
                    <img src={exam.schoolImage} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{exam.course}</p>
                      <p className="text-xs text-gray-500">{exam.city} · {new Date(exam.examDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                );
              })}
              {savedExams.length > 5 && (
                <p className="text-blue-600 text-sm font-medium text-center">+{savedExams.length - 5} fler</p>
              )}
            </div>
          )}
        </div>

        {/* Completed exams */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap size={15} className="text-green-600" />
              Historik
            </h3>
            <button
              onClick={() => setShowAddExam(true)}
              className="text-blue-600 text-xs font-semibold bg-blue-50 px-3 py-1.5 rounded-full"
            >
              + Lägg till
            </button>
          </div>
          {currentUser.completedExams.length === 0 ? (
            <p className="text-gray-400 text-sm">Inga genomförda prövningar registrerade.</p>
          ) : (
            <div className="space-y-2">
              {currentUser.completedExams.map((ce, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    ce.grade === 'A' ? 'bg-green-100 text-green-700' :
                    ce.grade === 'B' || ce.grade === 'C' ? 'bg-blue-100 text-blue-700' :
                    ce.grade === 'D' || ce.grade === 'E' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {ce.grade || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ce.course}</p>
                    <p className="text-xs text-gray-500">{ce.subject} · {new Date(ce.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Following */}
        {currentUser.following.length > 0 && (
          <div className="bg-white mx-4 mt-3 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Users size={15} className="text-purple-600" />
              Följer {currentUser.following.length} st
            </h3>
            <p className="text-gray-400 text-sm">Du följer {currentUser.following.length} personer i communityn.</p>
          </div>
        )}

        {/* Reset */}
        <div className="mx-4 mt-3 mb-4">
          <button
            onClick={resetApp}
            className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-medium py-3 rounded-2xl border border-red-100 bg-red-50"
          >
            <LogOut size={16} />
            Återställ appen
          </button>
        </div>
      </div>

      {/* Avatar picker modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowAvatarPicker(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Välj profilbild</h2>
              <button onClick={() => setShowAvatarPicker(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(url => (
                <button
                  key={url}
                  onClick={() => { updateUser({ avatar: url }); setShowAvatarPicker(false); }}
                  className={`relative rounded-2xl overflow-hidden aspect-square ${currentUser.avatar === url ? 'ring-3 ring-blue-600' : ''}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {currentUser.avatar === url && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowAddExam(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Lägg till prövning</h2>
              <button onClick={() => setShowAddExam(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={newExamSubject}
                onChange={e => setNewExamSubject(e.target.value)}
                placeholder="Ämne (t.ex. Matematik)"
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input
                value={newExamCourse}
                onChange={e => setNewExamCourse(e.target.value)}
                placeholder="Kurs (t.ex. Matematik 3b)"
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input
                type="date"
                value={newExamDate}
                onChange={e => setNewExamDate(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Betyg</p>
                <div className="flex gap-2">
                  {GRADE_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => setNewExamGrade(g)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                        newExamGrade === g ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
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
                className="w-full bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl"
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
