import type { Language } from '../types'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const plain = new Intl.NumberFormat('en-IN')

/** ₹4,606 — Indian digit grouping, no decimals. */
export const rupees = (amount: number): string => inr.format(Math.round(amount))

export const rupeesExact = (amount: number): string => inrPaise.format(amount)

/** ₹34.8 L / ₹2.1 Cr — for district-level totals only. */
export function rupeesCompact(amount: number): string {
  if (Math.abs(amount) >= 1e7) return `₹${(amount / 1e7).toFixed(1)} Cr`
  if (Math.abs(amount) >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`
  if (Math.abs(amount) >= 1e3) return `₹${(amount / 1e3).toFixed(1)}k`
  return rupees(amount)
}

export const number = (value: number): string => plain.format(value)

/** 2500 kg → "2,500 kg"; also used for tonnes with one decimal. */
export const kilos = (kg: number, language: Language): string =>
  `${plain.format(Math.round(kg))} ${language === 'ta' ? 'கிலோ' : 'kg'}`

export const tonnes = (kg: number, language: Language): string =>
  `${(kg / 1000).toFixed(1)} ${language === 'ta' ? 'டன்' : 't'}`

export const quintals = (kg: number): number => kg / 100

/** 95 → "1 hr 35 min" · 40 → "40 min" */
export function duration(minutes: number, language: Language): string {
  const total = Math.max(0, Math.round(minutes))
  const min = language === 'ta' ? 'நிமிடம்' : 'min'
  const hr = language === 'ta' ? 'மணி' : 'hr'
  if (total < 60) return `${total} ${min}`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h} ${hr}` : `${h} ${hr} ${m} ${min}`
}

/** 545 (minutes past midnight) → "9:05 AM" */
export function clock(minutesPastMidnight: number): string {
  const wrapped = ((Math.round(minutesPastMidnight) % 1440) + 1440) % 1440
  const h24 = Math.floor(wrapped / 60)
  const m = wrapped % 60
  const suffix = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function slotRange(startMinutes: number, endMinutes: number): string {
  return `${clock(startMinutes)} – ${clock(endMinutes)}`
}

export const minutesNow = (at: Date = new Date()): number => at.getHours() * 60 + at.getMinutes()

export function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Today" / "Tomorrow" / "12 Sep" */
export function dateLabel(iso: string, language: Language): string {
  if (iso === isoDate(0)) return language === 'ta' ? 'இன்று' : 'Today'
  if (iso === isoDate(1)) return language === 'ta' ? 'நாளை' : 'Tomorrow'
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

/** "12 Sep, 4:05 PM" for timestamps in history lists. */
export function timestampLabel(ms: number, language: Language): string {
  return new Date(ms).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** 9876543210 → "+91 98765 43210" */
export function phoneLabel(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10)
  if (digits.length !== 10) return phone
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}
