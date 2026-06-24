import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Award, User, MapPin, ChevronRight, CheckCircle2, Star } from 'lucide-react'
import { getExamById, getSchoolById } from '@/lib/data'
import { formatDate, formatPrice } from '@/lib/utils'
import LiveAvailability from '@/components/LiveAvailability'
import SaveButton from '@/components/SaveButton'
import PageHeader from '@/components/PageHeader'

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  const exam = getExamById(params.id)
  if (!exam) notFound()
  const school = getSchoolById(exam.schoolId)

  return (
    <div className="pb-28 md:pb-12">
      <PageHeader title={exam.course} fallbackHref="/upptack" />

      <div className="relative bg-gradient-to-br from-primary-700 to-primary-900 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary-200">
                {exam.subject} · {exam.level}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{exam.course}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-primary-100">
                <MapPin size={15} />
                {school?.name}, {school?.city}
              </p>
            </div>
            <SaveButton examId={exam.id} className="hidden sm:flex" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <LiveAvailability initialAvailable={exam.availableSpots} total={exam.totalSpots} />

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Detaljer</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DetailItem icon={Clock} label="Datum & tid" value={`${formatDate(exam.date)}, ${exam.time}`} />
                <DetailItem icon={Clock} label="Längd" value={`${exam.duration} minuter`} />
                <DetailItem icon={Award} label="Poäng" value={`${exam.points} p`} />
                <DetailItem icon={User} label="Examinator" value={exam.examiner} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 text-base font-semibold text-slate-900">Om prövningen</h2>
              <p className="text-sm leading-relaxed text-slate-600">{exam.description}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Krav & att ta med</h2>
              <ul className="space-y-2">
                {exam.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </section>

            {school && (
              <section>
                <h2 className="mb-3 text-base font-semibold text-slate-900">Om skolan</h2>
                <Link
                  href={`/skola/${school.id}`}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 text-xl font-bold text-primary-700">
                    {school.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{school.name}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {school.rating} ({school.reviewCount} omdömen) · {school.city}
                    </div>
                  </div>
                  <ChevronRight size={20} className="flex-shrink-0 text-slate-400" />
                </Link>
              </section>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-2xl font-bold text-slate-900">{formatPrice(exam.price)}</p>
              <p className="mb-4 text-sm text-slate-500">per prövningstillfälle</p>
              <Link
                href={`/boka/${exam.id}`}
                className="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Boka prövning
              </Link>
              <p className="mt-3 text-center text-xs text-slate-400">
                Sista anmälningsdag: {formatDate(exam.registrationDeadline)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-slate-200 bg-white p-4 md:hidden">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-lg font-bold text-slate-900">{formatPrice(exam.price)}</p>
            <p className="text-xs text-slate-500">{exam.availableSpots} platser kvar</p>
          </div>
          <Link
            href={`/boka/${exam.id}`}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            Boka prövning
          </Link>
        </div>
      </div>
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="mt-0.5 flex-shrink-0 text-primary-600" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}
