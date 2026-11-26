import { exerciseName } from '../data/exercises'
import { messages } from '../i18n'
import { numberFormat } from '../i18n/format'
import { getLocale, type Locale } from '../i18n/locale'
import type { BodyWeightEntry, WorkoutLog } from '../types/models'
import { setLoadKg } from './workoutMath'

/**
 * CSV the way Excel opens it by double-click in the app language: German with semicolons and a
 * decimal comma, English with commas and a decimal point. UTF-8 with BOM, so umlauts show
 * correctly.
 */
const SEPARATORS: Record<Locale, string> = { de: ';', en: ',' }
const BOM = '﻿'

function cell(value: string | number | null, locale: Locale): string {
  if (value === null) return ''
  const text = typeof value === 'number' ? numberFormat({ maximumFractionDigits: 2, useGrouping: false }, locale).format(value) : value
  // Quote cells containing the separator, quotes or line breaks; double embedded quotes.
  const needsQuotes = text.includes(SEPARATORS[locale]) || /["\r\n]/.test(text)
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(header: string[], rows: (string | number | null)[][], locale: Locale = getLocale()): string {
  return BOM + [header, ...rows].map((row) => row.map((value) => cell(value, locale)).join(SEPARATORS[locale])).join('\r\n') + '\r\n'
}

/** One row per set, oldest day first: the most flexible layout for pivot tables. */
export function workoutsToCsv(logs: WorkoutLog[], locale: Locale = getLocale()): string {
  const texts = messages(locale)
  const rows: (string | number | null)[][] = []
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const entry of [...log.entries].sort((a, b) => a.position - b.position)) {
      entry.sets.forEach((set, index) => {
        rows.push([
          log.date,
          exerciseName(entry.exerciseId, entry.exerciseName),
          texts.catalog.muscles[entry.primaryMuscle],
          index + 1,
          set.reps,
          set.weightKg,
          set.weightKg === null ? null : entry.perDumbbell ? texts.csv.perDumbbell : texts.csv.total,
          set.weightKg === null ? null : set.reps * setLoadKg(entry, set),
        ])
      })
    }
  }
  return toCsv(texts.csv.workoutHeader, rows, locale)
}

export function bodyWeightsToCsv(entries: BodyWeightEntry[], locale: Locale = getLocale()): string {
  return toCsv(
    messages(locale).csv.bodyWeightHeader,
    [...entries].sort((a, b) => a.date.localeCompare(b.date)).map((entry) => [entry.date, entry.weightKg]),
    locale,
  )
}

/** Hands the text to the browser as a file download. */
export function downloadFile(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Give the browser a moment to start the download before releasing the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
