import { useMemo, useState } from 'react';
import { MessageSquare, MessageCircle, Trash2, Send } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PostKind } from '../types';
import { initialsOf } from '../lib/avatar';
import { timeAgo } from '../lib/relativeTime';
import {
  POST_KIND_ORDER,
  POST_KIND_TONES,
  countByKind,
  postKindOf,
  postKindTone,
} from '../lib/postKind';

/** A subject's colour, for its chip on a thread. */
const SUBJECT_TONE: Record<string, string> = {
  Matematik: 'bg-brand-50 text-brand-700',
  Engelska: 'bg-accent2-50 text-accent2-700',
  Svenska: 'bg-trust-50 text-trust-700',
  Kemi: 'bg-violet-tint text-violet-ink',
  Fysik: 'bg-amber-accent-50 text-amber-accent',
};

/** Five stable avatar colours, picked from the author's id rather than at
    random so the same person is the same colour on every thread. */
const AVATAR_TONES = [
  'bg-accent2-500',
  'bg-brand-500',
  'bg-trust-500',
  'bg-violet-ink',
  'bg-amber-accent',
];
function avatarTone(userId: string) {
  let h = 0;
  for (const c of userId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/** Which kind a fresh post gets. The composer's placeholder asks a question,
    so a question is the honest default. */
const DEFAULT_KIND: PostKind = 'fråga';

export function Community() {
  const { posts, addPost, addReply, deletePost, deleteReply, currentUser } = useStore();
  /** '' means every kind. Otherwise one colour from the legend. */
  const [kindFilter, setKindFilter] = useState<PostKind | ''>('');
  const [composeKind, setComposeKind] = useState<PostKind>(DEFAULT_KIND);
  const [draft, setDraft] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const counts = useMemo(() => countByKind(posts), [posts]);
  const threads = useMemo(
    () => (kindFilter ? posts.filter((p) => postKindOf(p) === kindFilter) : posts),
    [posts, kindFilter],
  );

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    addPost(text, undefined, composeKind);
    setDraft('');
  };

  const sendReply = (postId: string) => {
    const text = reply.trim();
    if (!text) return;
    addReply(postId, text);
    setReply('');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-cream">
      <div className="max-w-screen-xl mx-auto w-full px-4 lg:px-8 py-6 lg:py-8 pt-14 lg:pt-8 flex flex-col gap-[18px] animate-rise-in pb-28 lg:pb-10">
        <div>
          <h1 className="font-hero-xl text-[38px] sm:text-[48px] lg:text-[56px] leading-none text-ink">
            Forum
          </h1>
          <p className="font-display italic text-[17px] sm:text-[20px] text-ink-soft mt-2">
            {posts.length} trådar · färgen säger vilken sort
          </p>
        </div>

        {/* Filter by kind. Each button carries the kind's colour and its count,
            so the palette here reads the same as the coloured rail on a thread.
            A kind with nothing in it isn't offered — an empty "Segrar" button
            is a promise of results that aren't there. */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setKindFilter('')}
            aria-pressed={kindFilter === ''}
            className={`rounded-full px-[18px] py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 ${
              kindFilter === ''
                ? 'bg-ink text-cream'
                : 'bg-surface text-ink-soft border-[1.5px] border-line hover:border-ink'
            }`}
          >
            Allt {posts.length}
          </button>
          {POST_KIND_ORDER.filter((k) => counts[k] > 0).map((k) => {
            const tone = POST_KIND_TONES[k];
            const active = kindFilter === k;
            return (
              <button
                key={k}
                onClick={() => setKindFilter(active ? '' : k)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full px-[18px] py-2.5 text-[13.5px] font-bold transition-transform hover:-translate-y-0.5 ${
                  active
                    ? `${tone.chip}`
                    : 'bg-surface text-ink-soft border-[1.5px] border-line hover:border-ink'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-white/80' : tone.dot}`}
                  aria-hidden="true"
                />
                {tone.pluralLabel} {counts[k]}
              </button>
            );
          })}
        </div>

        {/* Ask. The kind picker sits above the field so a post is filed under a
            colour before it's written, not guessed afterwards. */}
        <div className="bg-accent2-50 border-2 border-accent2-500 rounded-[26px] p-2.5 flex flex-col gap-2.5">
          <div className="flex gap-1.5 flex-wrap px-1 pt-1">
            {POST_KIND_ORDER.map((k) => {
              const tone = POST_KIND_TONES[k];
              const active = composeKind === k;
              return (
                <button
                  key={k}
                  onClick={() => setComposeKind(k)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                    active ? tone.chip : 'bg-white/70 text-ink-soft hover:bg-white'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${active ? 'bg-white/80' : tone.dot}`}
                    aria-hidden="true"
                  />
                  {tone.label}
                </button>
              );
            })}
          </div>
          <div className="focus-ring-host flex items-center gap-3 bg-surface rounded-[20px] pl-4 pr-2 py-1.5">
            <MessageSquare size={19} strokeWidth={2.2} className="text-accent2-500 flex-shrink-0" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && post()}
              placeholder={
                composeKind === 'fråga'
                  ? 'Ställ en fråga till andra som prövar…'
                  : composeKind === 'tips'
                    ? 'Dela ett tips som hjälpte dig…'
                    : composeKind === 'seger'
                      ? 'Berätta om en prövning du klarade…'
                      : 'Starta en diskussion…'
              }
              aria-label="Skriv ett inlägg"
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[16px] font-semibold text-accent2-700 placeholder-accent2-300 py-3"
            />
            <button
              onClick={post}
              disabled={!draft.trim()}
              className="bg-accent2-500 hover:bg-accent2-700 disabled:opacity-40 text-white font-bold text-[13.5px] px-5 py-3 rounded-[16px] whitespace-nowrap transition-transform hover:scale-105 disabled:hover:scale-100"
            >
              Posta
            </button>
          </div>
        </div>

        {/* Threads */}
        <div className="flex flex-col gap-3">
          {threads.length === 0 && (
            <div className="bg-surface border-[1.5px] border-dashed border-line rounded-[26px] p-9 text-center font-display italic text-[18px] text-ink-soft">
              Inga trådar här än — skriv det första inlägget.
            </div>
          )}
          {threads.map((t) => {
            const open = openId === t.id;
            const mine = t.userId === 'me';
            const tone = postKindTone(t);
            return (
              <div
                key={t.id}
                className={`flex bg-surface border-[1.5px] rounded-[28px] overflow-hidden transition-[transform,border-color] duration-150 ${
                  open ? 'border-ink' : 'border-line hover:-translate-y-0.5 hover:border-ink'
                }`}
              >
                {/* The kind, before any words */}
                <div className={`w-[9px] flex-shrink-0 ${tone.rail}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => setOpenId(open ? null : t.id)}
                    aria-expanded={open}
                    className="flex gap-4 items-start px-[22px] py-5 w-full text-left"
                  >
                    <span
                      className={`w-11 h-11 rounded-[15px] flex items-center justify-center font-bold text-[14.5px] text-white flex-shrink-0 ${avatarTone(t.userId)}`}
                    >
                      {initialsOf(t.userName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-semibold text-[18px] sm:text-[20px] leading-[1.25] text-ink">
                        {t.content}
                      </span>
                      <span className="flex gap-2 flex-wrap mt-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold text-[12.5px] px-3.5 py-2 rounded-full ${tone.softChip}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${tone.dot}`} aria-hidden="true" />
                          {tone.label}
                        </span>
                        {t.subject && (
                          <span
                            className={`font-bold text-[12.5px] px-3.5 py-2 rounded-full ${SUBJECT_TONE[t.subject] ?? 'bg-cream text-ink-soft'}`}
                          >
                            {t.subject}
                          </span>
                        )}
                        <span className="bg-cream text-ink-soft font-bold text-[12.5px] px-3.5 py-2 rounded-full">
                          {mine ? 'Du' : t.userName}
                        </span>
                        <span className="bg-cream text-ink-soft font-bold text-[12.5px] px-3.5 py-2 rounded-full">
                          {timeAgo(t.createdAt)}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-ink text-cream font-bold text-[13px] px-3.5 py-2.5 rounded-full flex-shrink-0 tnum">
                      <MessageCircle size={14} />
                      {t.replies.length}
                    </span>
                  </button>

                  {open && (
                    <div className="border-t-[1.5px] border-sand bg-cream px-[22px] py-[18px] flex flex-col gap-2.5">
                      {t.replies.length === 0 && (
                        <p className="font-display italic text-[15px] text-ink-soft">
                          Inga svar än. Var först.
                        </p>
                      )}
                      {t.replies.map((r, i) => {
                        const own = r.userId === 'me';
                        const right = own || i % 2 === 1;
                        return (
                          <div
                            key={r.id}
                            className={`max-w-[78%] rounded-[20px] px-[18px] py-3.5 ${
                              right
                                ? 'ml-auto bg-ink text-cream'
                                : 'bg-surface border-[1.5px] border-line text-ink'
                            }`}
                          >
                            <p className="text-[11.5px] font-bold uppercase tracking-[.06em] opacity-70">
                              {own ? 'Du' : r.userName}
                            </p>
                            <p className="text-[15px] font-semibold leading-[1.4] mt-0.5">
                              {r.content}
                            </p>
                            {own && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Ta bort ditt svar?')) deleteReply(t.id, r.id);
                                }}
                                aria-label="Ta bort ditt svar"
                                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-bold opacity-70 hover:opacity-100"
                              >
                                <Trash2 size={12} /> Ta bort
                              </button>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendReply(t.id)}
                          placeholder="Skriv ett svar…"
                          aria-label="Skriv ett svar"
                          className="flex-1 min-w-0 bg-surface border-[1.5px] border-line rounded-[20px] px-4 py-3 text-[14.5px] font-semibold text-ink outline-none focus:border-ink"
                        />
                        <button
                          onClick={() => sendReply(t.id)}
                          disabled={!reply.trim()}
                          aria-label="Skicka svar"
                          className="w-11 h-11 rounded-[16px] bg-ink text-cream flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                        >
                          <Send size={16} />
                        </button>
                      </div>

                      {mine && (
                        <button
                          onClick={() => {
                            if (window.confirm('Ta bort ditt inlägg?')) {
                              deletePost(t.id);
                              setOpenId(null);
                            }
                          }}
                          className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-bold text-ink-soft hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} /> Ta bort inlägget
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11.5px] text-ink-faint leading-relaxed">
          Profilbilder i forumet är alltid ritade monogram — {currentUser.name} inkluderad. Appen
          visar aldrig porträtt av påhittade personer.
        </p>
      </div>
    </div>
  );
}
