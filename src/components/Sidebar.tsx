import { HelpCircle, ChevronRight, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Avatar } from './Avatar';
import { NAV_ITEMS } from '../lib/navItems';
import { isOpenForRegistration } from '../lib/examStatus';
import { useMinuteTick } from '../hooks/useMinuteTick';

export function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    savedExams,
    viewedExams,
    posts,
    exams,
    currentUser,
    setShowingFaq,
  } = useStore();
  const tick = useMinuteTick();

  // The one live number in the app, recomputed on the same minute tick the
  // listings use so the sidebar can't drift from the cards it sits next to.
  const openNow = useMemo(
    () => exams.filter(isOpenForRegistration).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exams, tick],
  );

  /** What each tab has waiting, or null when a badge would just say "0". */
  const badgeFor = (id: string): number | null => {
    const n =
      id === 'exams'
        ? savedExams.length
        : id === 'history'
          ? viewedExams.length
          : id === 'community'
            ? posts.length
            : 0;
    return n > 0 ? n : null;
  };

  return (
    <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 h-screen bg-surface border-r border-line px-4 py-6">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-7">
        <div className="relative w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30">
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent2-500 border-2 border-surface"
            aria-hidden="true"
          />
          <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none" aria-hidden="true">
            <path
              d="M8 32L20 8L32 32"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 24H28" stroke="#BFF3FF" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[18px] font-bold text-ink font-display leading-none">Prövningar</p>
          <p className="text-[11.5px] text-ink-soft mt-1">läs upp betyget</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1.5">
        {NAV_ITEMS.map(({ id, label, hint, icon: Icon, tone }) => {
          const isActive = activeTab === id;
          const badge = badgeFor(id);
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? `${tone.gradient} ${tone.glow} text-white`
                  : `text-ink-soft ${tone.hover}`
              }`}
            >
              {/* The icon keeps its tile in both states: white-on-glass when
                  active, tinted when resting. Without the tile the resting rows
                  went back to being five grey icons in a column. */}
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive ? 'bg-white/20' : tone.tint
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.5 : 2.1}
                  className={isActive ? 'text-white' : tone.ink}
                />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-[15px] leading-tight tracking-tight">
                  {label}
                </span>
                <span
                  className={`block text-[11px] leading-tight mt-0.5 truncate ${
                    isActive ? 'text-white/75' : 'text-ink-faint'
                  }`}
                >
                  {hint}
                </span>
              </span>
              {badge !== null && (
                <span
                  className={`text-[11px] font-extrabold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-white/25 text-white' : `${tone.solid} text-white`
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live count. The only number here that changes on its own, so it gets
          to be the one thing that moves — and it links somewhere, because a
          statistic you can't act on is decoration. */}
      <button
        onClick={() => setActiveTab('discover')}
        className="mt-5 w-full text-left rounded-xl p-3.5 bg-gradient-to-br from-trust-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-98 transition-transform"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          Just nu
        </span>
        <span className="block font-display text-3xl font-semibold leading-none mt-1.5">
          {openNow}
        </span>
        <span className="block text-[12px] text-white/85 mt-1 font-medium">
          prövningar går att boka
        </span>
      </button>

      <div className="flex-1" />

      {/* FAQ */}
      <button
        onClick={() => setShowingFaq(true)}
        className="mt-2 w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-cream hover:bg-sand border border-line transition-colors text-left group"
      >
        <span className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <HelpCircle size={19} className="text-violet-600" strokeWidth={2.1} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-ink text-[14px] leading-tight">Vanliga frågor</span>
          <span className="block text-[11px] text-ink-faint leading-tight mt-0.5">
            Kostnad, regler, anmälan
          </span>
        </span>
        <ChevronRight
          size={16}
          className="text-ink-faint flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        />
      </button>

      {/* Who you are, at the foot of the rail */}
      <button
        onClick={() => setActiveTab('profile')}
        className="mt-2 w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-sand transition-colors text-left"
      >
        <Avatar name={currentUser.name} src={currentUser.avatar} seed="me" size={32} />
        <span className="font-semibold text-ink text-[13px] truncate flex-1">
          {currentUser.name}
        </span>
        <ChevronRight size={15} className="text-ink-faint flex-shrink-0" />
      </button>

      <p className="mt-2.5 px-2 text-[10.5px] text-ink-faint leading-relaxed flex items-start gap-1.5">
        <Sparkles size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
        Varje listning är kontrollerad mot skolans egen sida. Inga gissade datum.
      </p>
    </aside>
  );
}
