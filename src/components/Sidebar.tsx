import { useStore } from '../store/useStore';
import { NAV_ITEMS } from '../lib/navItems';
import { initialsOf } from '../lib/avatar';

/**
 * The rail, as the redesign draws it.
 *
 * Two things carry it. Each destination owns a colour — filled and glowing when
 * active, a tinted icon tile when resting — so after a week you stop reading
 * the labels and go by colour. And Upptäck is deliberately bigger than the
 * other four: it is where nine visits in ten are going, and a nav that gives
 * five equal rows to one job people do constantly and four they do rarely is
 * pretending they weigh the same.
 */
export function Sidebar() {
  const { activeTab, setActiveTab, savedExams, viewedExams, posts, currentUser } = useStore();

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
    <aside className="hidden lg:flex flex-col gap-6 w-[258px] flex-shrink-0 sticky top-0 h-screen min-h-[640px] overflow-y-auto bg-surface border-r-[1.5px] border-line rounded-r-[34px] px-4 py-[22px]">
      {/* Wordmark, and a way home */}
      <button
        onClick={() => setActiveTab('discover')}
        className="flex items-center gap-[11px] px-1.5 py-1 rounded-[18px] text-left transition-transform hover:translate-x-0.5"
      >
        <span className="relative w-[42px] h-[42px] flex-shrink-0">
          <span className="absolute inset-0 rounded-[15px] bg-brand-50 border-[1.5px] border-brand-500 flex items-center justify-center font-hero text-[27px] leading-none text-brand-700 pt-0.5">
            P
          </span>
          <span
            className="absolute -right-[3px] -top-[3px] w-[13px] h-[13px] rounded-full bg-accent2-500 border-2 border-surface"
            aria-hidden="true"
          />
        </span>
        <span>
          <span className="block font-display font-semibold text-[18px] text-ink tracking-tight">
            Prövningar
          </span>
          <span className="block text-[11.5px] text-ink-soft -mt-px">läs upp betyget</span>
        </span>
      </button>

      <nav className="flex flex-col gap-[7px]">
        {NAV_ITEMS.map(({ id, label, icon: Icon, tone }) => {
          const isActive = activeTab === id;
          const badge = badgeFor(id);
          // Upptäck gets the larger row; the other four share the smaller one.
          const lead = id === 'discover';
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center text-left transition-[transform,background] duration-150 hover:translate-x-[3px] ${
                lead
                  ? 'gap-3.5 px-[15px] py-4 rounded-[22px] text-[17px] font-extrabold'
                  : 'gap-[13px] px-[13px] py-[11px] rounded-[20px] text-[14.5px] font-bold'
              } ${isActive ? `${tone.gradient} ${tone.glow} text-white` : `text-ink-soft ${tone.hover}`}`}
            >
              <span
                className={`flex items-center justify-center flex-shrink-0 ${
                  lead ? 'w-9 h-9 rounded-[13px]' : 'w-[30px] h-[30px] rounded-[11px]'
                } ${isActive ? 'bg-white/[.22]' : tone.tint}`}
              >
                <Icon
                  size={lead ? 20 : 17}
                  strokeWidth={2.1}
                  className={isActive ? 'text-white' : tone.ink}
                />
              </span>
              <span className="flex-1 min-w-0 truncate">{label}</span>
              {badge !== null && (
                <span
                  className={`text-[11px] font-extrabold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center flex-shrink-0 tnum ${
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

      <div className="flex-1" />

      {/* Who you are */}
      <button
        onClick={() => setActiveTab('profile')}
        className="flex items-center gap-3 px-1.5 py-1 rounded-[18px] text-left transition-transform hover:translate-x-0.5"
      >
        <span className="w-[34px] h-[34px] rounded-xl bg-accent2-500 text-white text-[13px] font-extrabold flex items-center justify-center flex-shrink-0">
          {initialsOf(currentUser.name)}
        </span>
        <span className="font-bold text-ink text-[14px] truncate">{currentUser.name}</span>
      </button>
    </aside>
  );
}
