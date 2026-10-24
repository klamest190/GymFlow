import { MUSCLE_GROUP_LABELS } from '../data/muscleGroups'
import type { BodyWeightEntry, WorkoutLog } from '../types/models'
import { setLoadKg } from './workoutMath'

/**
 * CSV for German Excel: semicolon separator, decimal comma, UTF-8 with BOM (so umlauts show
 * correctly when the file is opened by double-click).
 */
const SEPARATOR = ';'
const BOM = '﻿'

const decimal = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2, useGrouping: false })

function cell(value: string | number | null): string {
  if (value === null) return ''
  const text = typeof value === 'number' ? decimal.format(value) : value
  // Quote cells containing the separator, quotes or line breaks; double embedded quotes.
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  return BOM + [header, ...rows].map((row) => row.map(cell).join(SEPARATOR)).join('\r\n') + '\r\n'
}

/** One row per set, oldest day first: the most flexible layout for pivot tables. */
export function workoutsToCsv(logs: WorkoutLog[]): string {
  const rows: (string | number | null)[][] = []
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const entry of [...log.entries].sort((a, b) => a.position - b.position)) {
      entry.sets.forEach((set, index) => {
        rows.push([
          log.date,
          entry.exerciseName,
          MUSCLE_GROUP_LABELS[entry.primaryMuscle],
          index + 1,
          set.reps,
          set.weightKg,
          set.weightKg === null ? null : entry.perDumbbell ? 'je Hantel' : 'gesamt',
          set.weightKg === null ? null : set.reps * setLoadKg(entry, set),
        ])
      })
    }
  }
  return toCsv(['Datum', 'Übung', 'Muskelgruppe', 'Satz', 'Wiederholungen', 'Gewicht (kg)', 'Gewicht gilt', 'Volumen (kg)'], rows)
}

export function bodyWeightsToCsv(entries: BodyWeightEntry[]): string {
  return toCsv(
    ['Datum', 'Körpergewicht (kg)'],
    [...entries].sort((a, b) => a.date.localeCompare(b.date)).map((entry) => [entry.date, entry.weightKg]),
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
