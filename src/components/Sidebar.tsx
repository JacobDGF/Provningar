import { HelpCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NAV_ITEMS } from '../lib/navItems';

export function Sidebar() {
  const { activeTab, setActiveTab, savedExams, setShowingFaq } = useStore();

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen bg-surface border-r border-line px-4 py-6">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
            <path d="M8 32L20 8L32 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 24H28" stroke="#FBE7C6" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xl font-bold text-ink font-display">Prövningar</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const badge = id === 'exams' && savedExams.length > 0 ? savedExams.length : null;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors ${
                isActive ? 'bg-brand-500 text-white shadow-sm shadow-brand-200' : 'text-ink-soft hover:bg-sand'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.3 : 1.9} className="flex-shrink-0" />
              <span className="font-bold text-base flex-1">{label}</span>
              {badge && (
                <span className={`text-xs font-bold min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-white/25 text-white' : 'bg-brand-500 text-white'
                }`}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* FAQ — big, prominent entry point */}
      <button
        onClick={() => setShowingFaq(true)}
        className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl bg-sand hover:bg-line transition-colors text-left"
      >
        <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <HelpCircle size={20} className="text-brand-700" />
        </div>
        <span className="font-bold text-ink text-sm">Vanliga frågor</span>
      </button>
    </aside>
  );
}
