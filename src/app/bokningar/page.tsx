'use client'

import Link from 'next/link'
import { CalendarCheck, ExternalLink, Compass } from 'lucide-react'
import { useBookings } from '@/context/BookingsContext'
import { getExamById, getSchoolById } from '@/lib/data'
import { formatDate, formatPrice } from '@/lib/utils'

export default function BokningarPage() {
  const { bookings } = useBookings()
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Mina bokningar</h1>
        <p className="mt-1 text-slate-600">
          {sorted.length > 0
            ? `Du har ${sorted.length} ${sorted.length === 1 ? 'anmälan' : 'anmälningar'}`
            : 'Dina bokade prövningar samlas här'}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <CalendarCheck size={28} />
          </span>
          <p className="text-lg font-semibold text-slate-700">Inga bokningar än</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            När du anmäler dig till en prövning hamnar den här så du enkelt kan följa upp den.
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
        <div className="space-y-3">
          {sorted.map((booking) => {
            const exam = getExamById(booking.examId)
            const school = getSchoolById(booking.schoolId)
            if (!exam || !school) return null
            return (
              <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                      {booking.referenceNumber}
                    </p>
                    <Link
                      href={`/provning/${exam.id}`}
                      className="mt-0.5 block text-lg font-bold text-slate-900 hover:text-primary-700"
                    >
                      {exam.course}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      {school.name}, {school.city}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(exam.date)}, {exam.time} · {formatPrice(exam.price)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    Väntar på skolan
                  </span>
                </div>
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Slutför hos {school.name}
                  <ExternalLink size={14} />
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
