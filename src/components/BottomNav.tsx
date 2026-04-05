import { Compass, BookOpen, Calendar, Users, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'discover', label: 'Upptäck', icon: Compass },
  { id: 'exams', label: 'Prövningar', icon: BookOpen },
  { id: 'calendar', label: 'Kalender', icon: Calendar },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'profile', label: 'Profil', icon: User },
];

export function BottomNav() {
  const { activeTab, setActiveTab, savedExams } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const badge = id === 'exams' && savedExams.length > 0 ? savedExams.length : null;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-2 px-1 relative"
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={`transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                />
                {badge && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
