'use client'

import { Bookmark } from 'lucide-react'
import { useSavedExams } from '@/context/SavedExamsContext'
import { cn } from '@/lib/utils'

export default function SaveButton({ examId, className }: { examId: string; className?: string }) {
  const { isSaved, toggle } = useSavedExams()
  const saved = isSaved(examId)

  return (
    <button
      type="button"
      aria-label={saved ? 'Ta bort från sparade' : 'Spara prövning'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(examId)
      }}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white',
        className
      )}
    >
      <Bookmark
        size={18}
        className={saved ? 'fill-primary-600 text-primary-600' : 'text-slate-600'}
      />
    </button>
  )
}
