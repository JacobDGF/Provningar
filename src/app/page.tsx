'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  ShieldCheck,
  Radio,
  LocateFixed,
  GraduationCap,
  ArrowRight,
  Star,
} from 'lucide-react'
import ExamCard from '@/components/ExamCard'
import { exams, schools, getSchoolById, subjectCategories } from '@/lib/data'
import { formatPrice } from '@/lib/utils'

const popularExams = exams.filter((e) => e.isPopular).slice(0, 4)
const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0)
const avgSuccessRate = Math.round(schools.reduce((sum, s) => sum + s.successRate, 0) / schools.length)

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    router.push(`/upptack${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-primary-100">
            <ShieldCheck size={14} />
            Sveriges guide för prövningar
          </span>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
            Höj dina betyg.
            <br />
            Kom in på din drömutbildning.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-100 sm:text-lg">
            Jämför och boka prövningar hos skolor i hela Sverige. Se lediga platser i realtid och
            hitta en skola nära dig.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="T.ex. Matematik 3c, Stockholm..."
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm shadow-lg outline-none ring-0 placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-accent-600"
            >
              Sök
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2">
            {subjectCategories.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/upptack?category=${encodeURIComponent(c.name)}`}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-4 sm:p-6">
          <Stat value={`${exams.length}+`} label="Aktiva prövningar" />
          <Stat value={`${schools.length}+`} label="Anslutna skolor" />
          <Stat value={`${(totalStudents / 1000).toFixed(0)}k+`} label="Hjälpta studenter" />
          <Stat value={`${avgSuccessRate}%`} label="Godkänt resultat" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Så funkar det</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Step
            number={1}
            icon={Search}
            title="Upptäck"
            description="Sök bland hundratals prövningar i hela Sverige. Filtrera på ämne, stad eller avstånd från dig."
          />
          <Step
            number={2}
            icon={Radio}
            title="Jämför i realtid"
            description="Se lediga platser, pris och betyg direkt – uppdaterat i realtid så du aldrig missar en plats."
          />
          <Step
            number={3}
            icon={GraduationCap}
            title="Boka hos skolan"
            description="Skicka din anmälan och slutför bokningen direkt hos skolan för att säkra din plats."
          />
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Populära prövningar just nu</h2>
            <Link
              href="/upptack"
              className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Visa alla
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} school={getSchoolById(exam.schoolId)} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-6 sm:p-8">
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} className="fill-amber-400" />
            ))}
          </div>
          <p className="mt-3 text-lg font-medium text-slate-800">
            &quot;Jag höjde mitt betyg i Matematik 3c från C till A på sex veckor. Prövningsguiden
            gjorde det enkelt att hitta en skola nära mig med lediga platser direkt.&quot;
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-600">Amanda, 19 år, Stockholm</p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary-700 to-primary-900 py-14 text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Redo att ta nästa steg mot din drömutbildning?
          </h2>
          <p className="mt-2 text-primary-100">
            Tusentals studenter har redan hittat sin prövning. Nu är det din tur.
          </p>
          <Link
            href="/upptack"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition-transform hover:scale-105"
          >
            <LocateFixed size={17} />
            Hitta prövningar nära dig
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <GraduationCap size={17} />
              </span>
              Prövningsguiden
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
              <Link href="/upptack" className="hover:text-slate-900">
                Upptäck
              </Link>
              <Link href="/sparade" className="hover:text-slate-900">
                Sparade
              </Link>
              <Link href="/bokningar" className="hover:text-slate-900">
                Mina bokningar
              </Link>
              <Link href="/om-oss" className="hover:text-slate-900">
                Hjälp & om oss
              </Link>
            </nav>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Prövningsguiden.se – Sveriges guide för prövningar
          </p>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-primary-700 sm:text-2xl">{value}</p>
      <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
    </div>
  )
}

function Step({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number
  icon: typeof Search
  title: string
  description: string
}) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-6">
      <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
        {number}
      </span>
      <Icon size={24} className="mb-3 text-primary-600" />
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  )
}
