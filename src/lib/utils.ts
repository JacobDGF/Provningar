export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('sv-SE', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Gratis'
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function timeUntil(dateStr: string): string {
  const now = new Date('2026-06-24')
  const target = new Date(dateStr)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'Passerat'
  if (diffDays === 0) return 'Idag'
  if (diffDays === 1) return 'Imorgon'
  if (diffDays < 7) return `${diffDays} dagar kvar`
  if (diffDays < 30) return `${Math.round(diffDays / 7)} veckor kvar`
  return `${Math.round(diffDays / 30)} månader kvar`
}

export function availabilityStatus(available: number, total: number): {
  label: string
  color: string
  bg: string
} {
  if (available === 0) {
    return { label: 'Fullbokad', color: 'text-red-700', bg: 'bg-red-50' }
  }
  const ratio = available / total
  if (ratio < 0.25) {
    return { label: `${available} platser kvar`, color: 'text-amber-700', bg: 'bg-amber-50' }
  }
  return { label: `${available} platser kvar`, color: 'text-emerald-700', bg: 'bg-emerald-50' }
}
