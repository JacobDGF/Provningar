'use client'

import { useEffect, useRef, useState } from 'react'
import { Radio } from 'lucide-react'
import { availabilityStatus } from '@/lib/utils'

export default function LiveAvailability({
  initialAvailable,
  total,
}: {
  initialAvailable: number
  total: number
}) {
  const [available, setAvailable] = useState(initialAvailable)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const lastUpdateRef = useRef(Date.now())

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdateRef.current) / 1000))
    }, 1000)

    const update = setInterval(() => {
      setAvailable((prev) => {
        if (prev <= 0) return prev
        const shouldChange = Math.random() < 0.35
        if (!shouldChange) return prev
        const next = Math.max(0, prev - 1)
        lastUpdateRef.current = Date.now()
        setSecondsAgo(0)
        return next
      })
    }, 9000)

    return () => {
      clearInterval(tick)
      clearInterval(update)
    }
  }, [])

  const status = availabilityStatus(available, total)

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          <Radio size={11} className="pulse-dot" />
          Realtidsuppdatering
        </div>
        <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
        <p className="text-xs text-slate-400">
          {secondsAgo < 5 ? 'Uppdaterad just nu' : `Uppdaterad för ${secondsAgo} sek sedan`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-slate-900">
          {available}
          <span className="text-base font-medium text-slate-400">/{total}</span>
        </p>
        <p className="text-xs text-slate-500">platser</p>
      </div>
    </div>
  )
}
