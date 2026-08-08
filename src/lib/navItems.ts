import { Compass, BookMarked, Users, History, User } from 'lucide-react';
import { TabId } from '../types';

export const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'discover', label: 'Upptäck', icon: Compass },
  { id: 'exams', label: 'Prövningar', icon: BookMarked },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'history', label: 'Historik', icon: History },
  { id: 'profile', label: 'Profil', icon: User },
];
