import type { BodyWeightEntry, DateKey } from '../types/models'
import { addDays, daysBetween } from './dates'

/** Plausible range, mirrored in firestore.rules (body_weights). */
export const MIN_BODY_WEIGHT = 20
export const MAX_BODY_WEIGHT = 400

/** "82,4" or "82.4" → 82.4 (one decimal); `null` if empty, not a number or out of range. */
export function parseWeight(input: string): number | null {
  const value = Number(input.trim().replace(',', '.'))
  if (!input.trim() || !Number.isFinite(value) || value < MIN_BODY_WEIGHT || value > MAX_BODY_WEIGHT) return null
  return Math.round(value * 10) / 10
}

export interface WeightTrend {
  latest: BodyWeightEntry
  /** The weigh-in the change is measured against, or `null` with a single entry. */
  reference: BodyWeightEntry | null
  /** latest − reference in kg (one decimal). */
  change: number | null
  /** Days between reference and latest. */
  days: number | null
}

/**
 * Latest weight compared with the last weigh-in at least `windowDays` ago, or with the very
 * first one if the history is shorter. `entries` must be sorted oldest first.
 */
export function weightTrend(entries: BodyWeightEntry[], windowDays = 30): WeightTrend | null {
  const latest = entries.at(-1)
  if (!latest) return null
  const cutoff = addDays(latest.date, -windowDays)
  const older = entries.filter((entry) => entry.date <= cutoff).at(-1)
  const reference = older ?? (entries.length > 1 ? entries[0] : null)
  if (!reference) return { latest, reference: null, change: null, days: null }
  return {
    latest,
    reference,
    change: Math.round((latest.weightKg - reference.weightKg) * 10) / 10,
    days: daysBetween(reference.date, latest.date),
  }
}

export interface ChartPoint {
  x: number
  y: number
  entry: BodyWeightEntry
}

/**
 * Points for a `width` × `height` chart of the weigh-ins within the last `days` days. The time
 * axis runs from the first to the last of them (so the line uses the full width); y is the
 * weight with a little headroom. Fewer than two points: nothing to draw.
 */
export function weightChartPoints(entries: BodyWeightEntry[], today: DateKey, width: number, height: number, days = 90): ChartPoint[] {
  const start = addDays(today, -(days - 1))
  const visible = entries.filter((entry) => entry.date >= start && entry.date <= today)
  if (visible.length < 2) return []
  const span = Math.max(1, daysBetween(visible[0].date, visible[visible.length - 1].date))
  const weights = visible.map((entry) => entry.weightKg)
  const min = Math.min(...weights) - 0.5
  const max = Math.max(...weights) + 0.5
  return visible.map((entry) => ({
    x: (daysBetween(visible[0].date, entry.date) / span) * width,
    y: height - ((entry.weightKg - min) / (max - min)) * height,
    entry,
  }))
}
