'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Check, ChevronLeft, CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
import { getExamById, getSchoolById } from '@/lib/data'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import { useBookings } from '@/context/BookingsContext'
import PageHeader from '@/components/PageHeader'

const STEPS = ['Bekräfta tillfälle', 'Dina uppgifter', 'Granska & bekräfta']

export default function BookingPage({ params }: { params: { id: string } }) {
  const exam = getExamById(params.id)
  const school = exam ? getSchoolById(exam.schoolId) : undefined
  const router = useRouter()
  const { createBooking } = useBookings()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personnummer: '',
    currentGrade: '',
    message: '',
  })

  if (!exam || !school) notFound()

  const canContinueStep2 =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim()

  function handleConfirm() {
    setSubmitting(true)
    const booking = createBooking(exam!.id, school!.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      personnummer: form.personnummer || undefined,
      currentGrade: form.currentGrade || undefined,
      message: form.message || undefined,
    })
    router.push(`/bekraftelse/${booking.id}`)
  }

  return (
    <div className="min-h-screen pb-12">
      <PageHeader title="Boka prövning" fallbackHref={`/provning/${exam.id}`} />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 hidden items-center gap-2 md:flex">
          <button
            onClick={() => router.push(`/provning/${exam.id}`)}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft size={16} />
            Tillbaka till prövningen
          </button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    i < step
                      ? 'bg-primary-600 text-white'
                      : i === step
                      ? 'border-2 border-primary-600 text-primary-600'
                      : 'border-2 border-slate-200 text-slate-400'
                  )}
                >
                  {i < step ? <Check size={15} /> : i + 1}
                </div>
                <span
                  className={cn(
                    'hidden text-center text-[11px] font-medium sm:block',
                    i <= step ? 'text-slate-700' : 'text-slate-400'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('mx-1 h-0.5 flex-1', i < step ? 'bg-primary-600' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                {exam.subject}
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900">{exam.course}</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-primary-600" />
                  {formatDate(exam.date)}, {exam.time}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={15} className="text-primary-600" />
                  {school.name}, {school.city}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">Pris</span>
                <span className="text-lg font-bold text-slate-900">{formatPrice(exam.price)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Genom att fortsätta skickar du en intresseanmälan. Den faktiska bokningen och
              betalningen slutförs hos {school.name} i nästa steg.
            </p>
            <button
              onClick={() => setStep(1)}
              className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              Fortsätt
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Förnamn" required>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Efternamn" required>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <Field label="E-post" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Telefon" required>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Personnummer (valfritt, för anmälan)">
              <input
                placeholder="ÅÅÅÅMMDD-XXXX"
                value={form.personnummer}
                onChange={(e) => setForm({ ...form, personnummer: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Nuvarande betyg (valfritt)">
              <select
                value={form.currentGrade}
                onChange={(e) => setForm({ ...form, currentGrade: e.target.value })}
                className="input"
              >
                <option value="">Välj betyg</option>
                {['F', 'E', 'D', 'C', 'B', 'A', 'Inget betyg'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Meddelande till skolan (valfritt)">
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                maxLength={300}
                className="input resize-none"
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(0)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tillbaka
              </button>
              <button
                disabled={!canContinueStep2}
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Granska bokning
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Prövning</h3>
              <SummaryRow label="Kurs" value={exam.course} />
              <SummaryRow label="Skola" value={school.name} />
              <SummaryRow label="Datum" value={`${formatDate(exam.date)}, ${exam.time}`} />
              <SummaryRow label="Pris" value={formatPrice(exam.price)} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Dina uppgifter</h3>
              <SummaryRow label="Namn" value={`${form.firstName} ${form.lastName}`} />
              <SummaryRow label="E-post" value={form.email} />
              <SummaryRow label="Telefon" value={form.phone} />
              {form.currentGrade && <SummaryRow label="Nuvarande betyg" value={form.currentGrade} />}
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-primary-50 p-4 text-sm text-primary-800">
              <ShieldCheck size={18} className="mt-0.5 flex-shrink-0" />
              <p>
                Efter bekräftelse tar vi dig till {school.name} där din anmälan slutförs och din
                plats säkras direkt hos skolan.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tillbaka
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? 'Bekräftar...' : 'Bekräfta och gå vidare'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          height: 44px;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          padding: 0 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        textarea.input {
          height: auto;
          padding: 0.625rem 0.875rem;
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}
