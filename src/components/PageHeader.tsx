'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title, fallbackHref }: { title: string; fallbackHref?: string }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
      <button
        onClick={() => (fallbackHref ? router.push(fallbackHref) : router.back())}
        aria-label="Tillbaka"
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
    </div>
  )
}
