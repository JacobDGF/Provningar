'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Bookmark, CalendarCheck, HelpCircle, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/upptack', label: 'Upptäck', icon: Compass },
  { href: '/sparade', label: 'Sparade prövningar', icon: Bookmark },
  { href: '/bokningar', label: 'Mina bokningar', icon: CalendarCheck },
  { href: '/om-oss', label: 'Hjälp & om oss', icon: HelpCircle },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/upptack" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <GraduationCap size={20} />
          </span>
          <span className="text-lg">
            Prövnings<span className="text-primary-600">guiden</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
