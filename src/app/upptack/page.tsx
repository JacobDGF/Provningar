'use client'

import { useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, LocateFixed, X } from 'lucide-react'
import ExamCard from '@/components/ExamCard'
import { exams, schools, getSchoolById, haversineDistance } from '@/lib/data'
import { subjectCategories } from '@/lib/data'
import { useLocation } from '@/context/LocationContext'
import { cn } from '@/lib/utils'

type SortKey = 'datum' | 'pris' | 'narhet' | 'popularitet'

export default function UpptackPage() {
  return (
    <Suspense fallback={null}>
      <UpptackContent />
    </Suspense>
  )
}

function UpptackContent() {
  const { coords, status, requestLocation, error } = useLocation()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [category, setCategory] = useState<string | null>(searchParams.get('category'))
  const [city, setCity] = useState<string | null>(searchParams.get('city'))
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [onlyFree, setOnlyFree] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('datum')
  const [showFilters, setShowFilters] = useState(false)

  const cities = useMemo(() => Array.from(new Set(schools.map((s) => s.city))).sort(), [])

  const results = useMemo(() => {
    let list = exams.map((exam) => ({ exam, school: getSchoolById(exam.schoolId) }))

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        ({ exam, school }) =>
          exam.subject.toLowerCase().includes(q) ||
          exam.course.toLowerCase().includes(q) ||
          school?.name.toLowerCase().includes(q) ||
          school?.city.toLowerCase().includes(q)
      )
    }
    if (category) {
      list = list.filter(({ exam }) => exam.subject.toLowerCase() === category.toLowerCase())
    }
    if (city) {
      list = list.filter(({ school }) => school?.city === city)
    }
    if (onlyAvailable) {
      list = list.filter(({ exam }) => exam.availableSpots > 0)
    }
    if (onlyFree) {
      list = list.filter(({ exam }) => exam.price === 0)
    }

    list.sort((a, b) => {
      if (sortBy === 'datum') return new Date(a.exam.date).getTime() - new Date(b.exam.date).getTime()
      if (sortBy === 'pris') return a.exam.price - b.exam.price
      if (sortBy === 'popularitet') return Number(b.exam.isPopular) - Number(a.exam.isPopular)
      if (sortBy === 'narhet' && coords && a.school && b.school) {
        const da = haversineDistance(coords.lat, coords.lng, a.school.lat, a.school.lng)
        const db = haversineDistance(coords.lat, coords.lng, b.school.lat, b.school.lng)
        return da - db
      }
      return 0
    })

    return list
  }, [query, category, city, onlyAvailable, onlyFree, sortBy, coords])

  const activeFilterCount = [category, city, onlyAvailable, onlyFree].filter(Boolean).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Upptäck prövningar</h1>
        <p className="mt-1 text-slate-600">
          {results.length} prövningar tillgängliga just nu i hela Sverige
        </p>
      </div>

      {status !== 'granted' && (
        <button
          onClick={requestLocation}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-left transition-colors hover:bg-primary-100"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white">
              <LocateFixed size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary-900">
                Hitta prövningar nära dig
              </p>
              <p className="text-xs text-primary-700">
                {status === 'loading'
                  ? 'Hämtar din plats…'
                  : error ?? 'Aktivera plats för att sortera efter avstånd'}
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white">
            Aktivera
          </span>
        </button>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök ämne, kurs eller skola..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-colors',
            showFilters || activeFilterCount > 0
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          )}
        >
          <SlidersHorizontal size={16} />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-primary-700">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {subjectCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory((prev) => (prev === c.name ? null : c.name))}
            className={cn(
              'flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              category === c.name
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Stad</label>
              <select
                value={city ?? ''}
                onChange={(e) => setCity(e.target.value || null)}
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
              >
                <option value="">Alla städer</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Sortera</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary-500"
              >
                <option value="datum">Tidigast datum</option>
                <option value="pris">Lägst pris</option>
                <option value="popularitet">Mest populära</option>
                <option value="narhet" disabled={!coords}>
                  Närmast mig {!coords && '(aktivera plats)'}
                </option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Endast lediga platser
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => setOnlyFree(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Gratis
            </label>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setCategory(null)
                  setCity(null)
                  setOnlyAvailable(false)
                  setOnlyFree(false)
                }}
                className="ml-auto flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <X size={14} />
                Rensa filter
              </button>
            )}
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-slate-700">Inga prövningar hittades</p>
          <p className="mt-1 text-sm text-slate-500">Försök justera dina filter eller sökord</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map(({ exam, school }) => (
            <ExamCard key={exam.id} exam={exam} school={school} />
          ))}
        </div>
      )}
    </div>
  )
}
