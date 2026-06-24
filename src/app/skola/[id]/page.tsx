import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Star,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Users,
  TrendingUp,
  CalendarDays,
} from 'lucide-react'
import { getSchoolById, getExamsBySchool } from '@/lib/data'
import { formatDate, formatPrice, availabilityStatus } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'

export default function SchoolPage({ params }: { params: { id: string } }) {
  const school = getSchoolById(params.id)
  if (!school) notFound()
  const schoolExams = getExamsBySchool(school.id)

  return (
    <div className="pb-12">
      <PageHeader title={school.name} fallbackHref="/upptack" />

      <div className="relative h-44 w-full bg-gradient-to-br from-primary-700 to-primary-900 sm:h-56">
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-5xl px-4 pb-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              {school.certifications.includes('Skolverket-godkänd') && (
                <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                  <ShieldCheck size={13} />
                  Skolverket-godkänd
                </span>
              )}
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white capitalize">
                {school.type}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{school.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-primary-100">
              <MapPin size={15} />
              {school.address}, {school.city}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Star} value={school.rating.toFixed(1)} label={`${school.reviewCount} omdömen`} />
              <StatCard icon={Users} value={school.studentCount.toLocaleString('sv-SE')} label="Studenter" />
              <StatCard icon={TrendingUp} value={`${school.successRate}%`} label="Godkänt resultat" />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 text-base font-semibold text-slate-900">Om {school.name}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{school.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {school.subjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Prövningar hos {school.name}
                </h2>
                <span className="text-sm text-slate-500">{schoolExams.length} st</span>
              </div>
              <div className="space-y-2">
                {schoolExams.map((exam) => {
                  const status = availabilityStatus(exam.availableSpots, exam.totalSpots)
                  return (
                    <Link
                      key={exam.id}
                      href={`/provning/${exam.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{exam.course}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays size={12} />
                          {formatDate(exam.date)} · {exam.time}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatPrice(exam.price)}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Kontakt</h2>
              <div className="space-y-3 text-sm">
                <a
                  href={`tel:${school.phone}`}
                  className="flex items-center gap-2.5 text-slate-600 hover:text-primary-700"
                >
                  <Phone size={16} className="text-primary-600" />
                  {school.phone}
                </a>
                <a
                  href={`mailto:${school.email}`}
                  className="flex items-center gap-2.5 text-slate-600 hover:text-primary-700"
                >
                  <Mail size={16} className="text-primary-600" />
                  {school.email}
                </a>
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-slate-600 hover:text-primary-700"
                >
                  <Globe size={16} className="text-primary-600" />
                  Skolans officiella hemsida
                </a>
              </div>
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Besök skolans hemsida
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              <p className="mb-1 flex justify-between">
                <span className="text-slate-400">Grundad</span>
                <span className="font-medium text-slate-700">{school.established}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Typ av skola</span>
                <span className="font-medium capitalize text-slate-700">{school.type}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: typeof Star; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <Icon size={16} className="mx-auto mb-1 text-primary-600" />
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
