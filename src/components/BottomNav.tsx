import { Compass, BookMarked, Users, History, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'discover', label: 'Upptäck', icon: Compass },
  { id: 'exams', label: 'Prövningar', icon: BookMarked },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'history', label: 'Historik', icon: History },
  { id: 'profile', label: 'Profil', icon: User },
];

export function BottomNav() {
  const { activeTab, setActiveTab, savedExams } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-line z-40 safe-bottom">
      <div className="max-w-lg mx-auto flex px-1 pt-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const badge = id === 'exams' && savedExams.length > 0 ? savedExams.length : null;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-1 px-0.5 active:scale-95 transition-transform"
            >
              <div className={`relative px-4 py-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-brand-500' : ''}`}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-ink-faint'}`}
                />
                {badge && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold ring-2 ring-surface">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] mt-1 font-semibold transition-colors duration-200 ${isActive ? 'text-brand-600' : 'text-ink-faint'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
