'use client'

import Link from 'next/link'
import { Bookmark, Compass } from 'lucide-react'
import ExamCard from '@/components/ExamCard'
import { useSavedExams } from '@/context/SavedExamsContext'
import { getExamById, getSchoolById } from '@/lib/data'

export default function SparadePage() {
  const { savedIds } = useSavedExams()

  const savedExams = savedIds
    .map((id) => getExamById(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Sparade prövningar</h1>
        <p className="mt-1 text-slate-600">
          {savedExams.length > 0
            ? `Du har sparat ${savedExams.length} ${savedExams.length === 1 ? 'prövning' : 'prövningar'}`
            : 'Spara prövningar du är intresserad av för att hitta dem snabbt senare'}
        </p>
      </div>

      {savedExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Bookmark size={28} />
          </span>
          <p className="text-lg font-semibold text-slate-700">Inga sparade prövningar än</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Tryck på bokmärkesikonen på en prövning för att spara den här och hitta den snabbt
            igen.
          </p>
          <Link
            href="/upptack"
            className="mt-5 flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            <Compass size={16} />
            Upptäck prövningar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} school={getSchoolById(exam.schoolId)} />
          ))}
        </div>
      )}
    </div>
  )
}
