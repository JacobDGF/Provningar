'use client'

import { notFound, useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, CalendarPlus, CalendarCheck, Compass } from 'lucide-react'
import { useBookings } from '@/context/BookingsContext'
import { getExamById, getSchoolById } from '@/lib/data'
import { formatDate, formatPrice } from '@/lib/utils'

export default function ConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { getBooking } = useBookings()
  const booking = getBooking(params.id)

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-700">Bokningen kunde inte hittas</p>
        <p className="mt-1 text-sm text-slate-500">
          Den kan ha gått förlorad om du rensat din webbläsardata.
        </p>
        <button
          onClick={() => router.push('/upptack')}
          className="mt-5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Till Upptäck
        </button>
      </div>
    )
  }

  const exam = getExamById(booking.examId)
  const school = getSchoolById(booking.schoolId)
  if (!exam || !school) notFound()

  function downloadIcs() {
    const start = new Date(`${exam!.date}T${exam!.time}:00`)
    const end = new Date(start.getTime() + exam!.duration * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `UID:${booking.referenceNumber}@provningsguiden.se`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Prövning i ${exam!.course}`,
      `LOCATION:${school!.name}, ${school!.address}, ${school!.city}`,
      `DESCRIPTION:Prövning i ${exam!.course} hos ${school!.name}. Referensnummer: ${booking.referenceNumber}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `provning-${booking.referenceNumber}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={34} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Din anmälan är registrerad!</h1>
        <p className="mt-1 text-slate-600">
          Ett steg kvar – slutför din bokning direkt hos {school.name}.
        </p>
        <p className="mt-3 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600">
          Referensnummer: <span className="font-bold text-slate-900">{booking.referenceNumber}</span>
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Sammanfattning</h2>
        <Row label="Prövning" value={exam.course} />
        <Row label="Skola" value={school.name} />
        <Row label="Datum" value={`${formatDate(exam.date)}, ${exam.time}`} />
        <Row label="Pris" value={formatPrice(exam.price)} />
      </div>

      <a
        href={school.website}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
      >
        Gå till {school.name} och slutför bokningen
        <ExternalLink size={16} />
      </a>
      <p className="mt-2 text-center text-xs text-slate-400">
        Du lämnar nu Prövningsguiden och kommer till skolans egna webbplats för att säkra din plats.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          onClick={downloadIcs}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <CalendarPlus size={16} />
          Lägg till i kalender
        </button>
        <button
          onClick={() => router.push('/bokningar')}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <CalendarCheck size={16} />
          Visa mina bokningar
        </button>
      </div>

      <button
        onClick={() => router.push('/upptack')}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <Compass size={15} />
        Tillbaka till Upptäck
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}
