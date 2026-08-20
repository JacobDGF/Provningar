import { Compass, BookMarked, Users, History, User } from 'lucide-react';
import { TabId } from '../types';

/**
 * The five tabs, one colour each.
 *
 * Every tab used to be the same brand teal, so the sidebar was five identical
 * rows and the only thing distinguishing them was a word you had to read. A
 * colour is recognised before a word is read, which is why every app you use
 * daily colours its destinations: after a week you stop reading "Community"
 * and just hit the pink one.
 *
 * The colours aren't decoration picked at random — each one argues for its
 * tab. Cyan is the map and the horizon; amber is the bookmark, the things you
 * put aside for yourself; magenta is people; violet is the past; emerald is
 * you, and growing.
 *
 * One deliberate limit: none of these is the app's *status* language. Red means
 * fullbokat and forest green means bookable, and those two live on the
 * listings, never in the nav — a nav that borrowed them would make "Profil"
 * look like a booking you can make. Emerald sits well clear of trust-green,
 * and nothing here is red at all.
 *
 * Class strings are written out in full rather than composed, because
 * Tailwind's scanner reads source text: a template literal like
 * `from-${c}-500` compiles to nothing at all.
 */
export interface NavTone {
  /** Filled state: gradient behind an active tab. */
  gradient: string;
  /** The glow under an active tab, in its own colour. */
  glow: string;
  /** Tinted surface for the resting icon tile. */
  tint: string;
  /** The icon's colour when resting. */
  ink: string;
  /** Hover wash on the row. */
  hover: string;
  /** Solid dot/badge colour. */
  solid: string;
}

export const NAV_ITEMS: {
  id: TabId;
  label: string;
  /** One line, shown under the label in the sidebar. */
  hint: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone: NavTone;
}[] = [
  {
    id: 'discover',
    label: 'Upptäck',
    hint: 'Kartan och alla tillfällen',
    icon: Compass,
    tone: {
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      glow: 'shadow-lg shadow-cyan-500/35',
      tint: 'bg-cyan-50',
      ink: 'text-cyan-600',
      hover: 'hover:bg-cyan-50',
      solid: 'bg-cyan-500',
    },
  },
  {
    id: 'exams',
    label: 'Prövningar',
    hint: 'Dina sparade',
    icon: BookMarked,
    tone: {
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      glow: 'shadow-lg shadow-amber-500/35',
      tint: 'bg-amber-50',
      ink: 'text-amber-600',
      hover: 'hover:bg-amber-50',
      solid: 'bg-amber-500',
    },
  },
  {
    id: 'community',
    label: 'Community',
    hint: 'Frågor och tips',
    icon: Users,
    tone: {
      gradient: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
      glow: 'shadow-lg shadow-fuchsia-500/35',
      tint: 'bg-fuchsia-50',
      ink: 'text-fuchsia-600',
      hover: 'hover:bg-fuchsia-50',
      solid: 'bg-fuchsia-500',
    },
  },
  {
    id: 'history',
    label: 'Historik',
    hint: 'Det du tittat på',
    icon: History,
    tone: {
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      glow: 'shadow-lg shadow-violet-500/35',
      tint: 'bg-violet-50',
      ink: 'text-violet-600',
      hover: 'hover:bg-violet-50',
      solid: 'bg-violet-500',
    },
  },
  {
    id: 'profile',
    label: 'Profil',
    hint: 'Betyg och dina data',
    icon: User,
    tone: {
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      glow: 'shadow-lg shadow-emerald-500/35',
      tint: 'bg-emerald-50',
      ink: 'text-emerald-600',
      hover: 'hover:bg-emerald-50',
      solid: 'bg-emerald-500',
    },
  },
];
