'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Bookmark, CalendarCheck, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/upptack', label: 'Upptäck', icon: Compass },
  { href: '/sparade', label: 'Sparade', icon: Bookmark },
  { href: '/bokningar', label: 'Bokningar', icon: CalendarCheck },
  { href: '/om-oss', label: 'Hjälp', icon: HelpCircle },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-primary-600' : 'text-slate-500'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
