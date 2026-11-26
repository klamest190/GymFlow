import { messages } from '../i18n'
import { dateFormat } from '../i18n/format'
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

// Formatters follow the app language (see i18n/format.ts), so they are looked up on every call.
const format = (options: Intl.DateTimeFormatOptions) => (key: DateKey) => dateFormat(options).format(fromDateKey(key))

/** "Montag, 13. Oktober" / "Monday 13 October" */
export const formatLong = format({ weekday: 'long', day: 'numeric', month: 'long' })
/** "13. Oktober 2026" / "13 October 2026" */
export const formatFullDate = format({ day: 'numeric', month: 'long', year: 'numeric' })
const formatShortWeekday = format({ weekday: 'short' })
/** "Mo" / "Mon" */
export const formatWeekday = (key: DateKey) => formatShortWeekday(key).replace('.', '')
/** "Oktober 2026" / "October 2026" */
export const formatMonth = format({ month: 'long', year: 'numeric' })
export const dayOfMonth = (key: DateKey) => fromDateKey(key).getDate()
const formatWeekdayLong = format({ weekday: 'long' })
const formatShortDate = format({ day: 'numeric', month: 'short' })

/** "Heute", "Gestern" or the weekday name ("Montag"). */
export function relativeDayLabel(key: DateKey): string {
  const texts = messages().common
  const today = todayKey()
  if (key === today) return texts.today
  if (key === addDays(today, -1)) return texts.yesterday
  return formatWeekdayLong(key)
}

/** Whole calendar days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / 86_400_000)
}

/** "Heute", "Gestern", "vor 3 Tagen" or "12. Okt." for anything older than a week. */
export function formatDaysAgo(key: DateKey): string {
  const texts = messages().common
  const days = daysBetween(key, todayKey())
  if (days <= 0) return texts.today
  if (days === 1) return texts.yesterday
  if (days < 7) return texts.daysAgo(days)
  return formatShortDate(key)
}

/** ISO 8601 week number (KW), as used in Germany. */
export function isoWeek(key: DateKey): number {
  const date = fromDateKey(key)
  // The ISO week belongs to the year of its Thursday.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const firstThursday = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

/** "13.10." / "13/10" */
export const formatDayMonth = format({ day: 'numeric', month: 'numeric' })
/** "Mo., 13. Okt." / "Mon 13 Oct" */
export const formatWeekdayDate = format({ weekday: 'short', day: 'numeric', month: 'short' })
