'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SavedExamsContextValue {
  savedIds: string[]
  toggle: (id: string) => void
  isSaved: (id: string) => boolean
}

const SavedExamsContext = createContext<SavedExamsContextValue | undefined>(undefined)

const STORAGE_KEY = 'provningsguiden_saved_exams'

export function SavedExamsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSavedIds(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds))
  }, [savedIds, mounted])

  function toggle(id: string) {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function isSaved(id: string) {
    return savedIds.includes(id)
  }

  return (
    <SavedExamsContext.Provider value={{ savedIds, toggle, isSaved }}>
      {children}
    </SavedExamsContext.Provider>
  )
}

export function useSavedExams() {
  const ctx = useContext(SavedExamsContext)
  if (!ctx) throw new Error('useSavedExams must be used within SavedExamsProvider')
  return ctx
}
