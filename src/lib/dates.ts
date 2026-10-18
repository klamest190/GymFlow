import type { DateKey } from '../types/models'

const pad = (value: number) => String(value).padStart(2, '0')

/** Local-time `YYYY-MM-DD`; never use `toISOString()` here, it shifts dates across UTC midnight. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayKey(): DateKey {
  return toDateKey(new Date())
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** Monday of the week containing `key` (ISO weeks start on Monday). */
export function startOfWeek(key: DateKey): DateKey {
  const weekday = (fromDateKey(key).getDay() + 6) % 7
  return addDays(key, -weekday)
}

export function weekDays(key: DateKey): DateKey[] {
  const monday = startOfWeek(key)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

const longFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
const fullDateFormatter = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
const weekdayLongFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'long' })
const weekdayFormatter = new Intl.DateTimeFormat('de-DE', { weekday: 'short' })
const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })

export const formatLong = (key: DateKey) => longFormatter.format(fromDateKey(key))
export const formatFullDate = (key: DateKey) => fullDateFormatter.format(fromDateKey(key))
export const formatWeekday = (key: DateKey) => weekdayFormatter.format(fromDateKey(key)).replace('.', '')
export const formatMonth = (key: DateKey) => monthFormatter.format(fromDateKey(key))
export const dayOfMonth = (key: DateKey) => fromDateKey(key).getDate()

/** "Heute", "Gestern" or the weekday name ("Montag"). */
export function relativeDayLabel(key: DateKey): string {
  const today = todayKey()
  if (key === today) return 'Heute'
  if (key === addDays(today, -1)) return 'Gestern'
  return weekdayLongFormatter.format(fromDateKey(key))
}

const shortDateFormatter = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' })

/** Whole calendar days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / 86_400_000)
}

/** "Heute", "Gestern", "vor 3 Tagen" or "12. Okt." for anything older than a week. */
export function formatDaysAgo(key: DateKey): string {
  const days = daysBetween(key, todayKey())
  if (days <= 0) return 'Heute'
  if (days === 1) return 'Gestern'
  if (days < 7) return `vor ${days} Tagen`
  return shortDateFormatter.format(fromDateKey(key))
}
