'use client'

import Link from 'next/link'
import { MapPin, Clock, Radio } from 'lucide-react'
import { Exam, School } from '@/lib/types'
import { formatDate, formatPrice, availabilityStatus, timeUntil } from '@/lib/utils'
import { useLocation } from '@/context/LocationContext'
import { haversineDistance } from '@/lib/data'
import { formatDistance } from '@/lib/utils'
import SaveButton from './SaveButton'

export default function ExamCard({ exam, school }: { exam: Exam; school?: School }) {
  const { coords } = useLocation()
  const status = availabilityStatus(exam.availableSpots, exam.totalSpots)

  const distanceKm =
    coords && school ? haversineDistance(coords.lat, coords.lng, school.lat, school.lng) : null

  return (
    <Link
      href={`/provning/${exam.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative h-32 w-full bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-100">
              {exam.subject}
            </p>
            <p className="mt-0.5 text-lg font-bold text-white">{exam.course}</p>
          </div>
        </div>
        <SaveButton examId={exam.id} className="absolute right-3 top-3" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-white">
          <Radio size={10} className="pulse-dot" />
          Live
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="truncate">{school?.name ?? exam.location}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Clock size={14} className="flex-shrink-0" />
          <span>
            {formatDate(exam.date)} · {exam.time}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
            {status.label}
          </span>
          {distanceKm !== null && distanceKm < 100 && (
            <span className="text-xs font-medium text-slate-500">{formatDistance(distanceKm)}</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">{timeUntil(exam.date)}</span>
          <span className="text-base font-bold text-slate-900">{formatPrice(exam.price)}</span>
        </div>
      </div>
    </Link>
  )
}
