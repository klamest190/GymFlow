import { afterEach, describe, expect, it } from 'vitest'
import { entry } from '../test/fixtures'
import { formatDayMonth, formatDaysAgo, formatFullDate, todayKey, addDays } from '../lib/dates'
import { formatLastTime, summarizeSets } from '../lib/exerciseHistory'
import { formatRecordValue } from '../lib/records'
import { formatCompact } from '../lib/stats'
import { getLocale, LOCALES, messages, setLocale } from '.'

afterEach(() => setLocale('de'))

describe('locale', () => {
  it('speaks German in tests unless switched', () => expect(getLocale()).toBe('de'))

  it('switches every formatter with the language', () => {
    setLocale('en')
    expect(formatFullDate('2026-10-13')).toBe('13 October 2026')
    expect(formatDayMonth('2026-10-13')).toBe('13/10')
    expect(formatDaysAgo(addDays(todayKey(), -3))).toBe('3 days ago')
    expect(formatCompact(12_900)).toBe('12.9k')
    expect(formatRecordValue('weight', 62.5)).toBe('62.5 kg')
    expect(formatRecordValue('reps', 20)).toBe('20 reps')

    setLocale('de')
    expect(formatFullDate('2026-10-13')).toBe('13. Oktober 2026')
    expect(formatCompact(12_900)).toBe('12,9k')
  })

  it('summarizes sets in English', () => {
    setLocale('en')
    expect(formatLastTime(entry('Curls', 3, 10, 7.5))).toBe('3 × 10 reps with 7.5 kg')
    expect(summarizeSets({ ...entry('Curls', 0, 0, null) })).toBe('No sets')
  })
})

describe('messages', () => {
  // The types make both languages share one shape; this catches an empty text slipping in.
  const strings = (value: unknown, path: string): [string, string][] => {
    if (typeof value === 'string') return [[path, value]]
    if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`))
    if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`))
    return []
  }

  it.each(LOCALES)('has no empty text in %s', (locale) => {
    for (const [path, text] of strings(messages(locale), locale)) expect(text.trim(), path).not.toBe('')
  })
})
