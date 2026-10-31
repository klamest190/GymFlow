import type { DateKey, MuscleGroup, WorkoutLog, WorkoutTotals } from '../types/models'
import { addDays, daysBetween, startOfWeek } from './dates'

/** The measure a chart plots. Volume = reps × kg (bodyweight sets count 0). */
export type Metric = 'reps' | 'sets' | 'volumeKg'

export const METRIC_LABELS: Record<Metric, string> = {
  reps: 'Wiederholungen',
  sets: 'Sätze',
  volumeKg: 'Volumen (kg)',
}

export const METRIC_SHORT_LABELS: Record<Metric, string> = {
  reps: 'Wdh.',
  sets: 'Sätze',
  volumeKg: 'Volumen',
}

/**
 * Days with at least one logged set. The tracker stores an exercise as soon as it is added, so a
 * log can exist without any training in it.
 */
export const trainingDays = (logs: WorkoutLog[]) => logs.filter((log) => log.totals.sets > 0)

const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
const compactOne = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

/** 1.284 → "1.284", 12.900 → "12,9k"; used by stat tiles and axis ticks. */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 10_000) return `${compactOne.format(value / 1000)}k`
  return integer.format(value)
}

export function formatMetric(value: number, metric: Metric): string {
  return metric === 'volumeKg' ? `${formatCompact(value)} kg` : formatCompact(value)
}

const emptyTotals = (): WorkoutTotals => ({ exercises: 0, sets: 0, reps: 0, volumeKg: 0 })

export interface PeriodSummary extends WorkoutTotals {
  /** Number of distinct training days. */
  days: number
}

/** Sums all logs with `from <= date <= to`. */
export function summarize(logs: WorkoutLog[], from: DateKey, to: DateKey): PeriodSummary {
  const summary: PeriodSummary = { ...emptyTotals(), days: 0 }
  for (const log of logs) {
    if (log.date < from || log.date > to || log.totals.sets === 0) continue
    summary.days += 1
    summary.exercises += log.totals.exercises
    summary.sets += log.totals.sets
    summary.reps += log.totals.reps
    summary.volumeKg += log.totals.volumeKg
  }
  return summary
}

/** Relative change in percent, or `null` when there is no baseline to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export interface WeekPoint extends PeriodSummary {
  weekStart: DateKey
  isCurrent: boolean
  /** The full week before, for "vs. Vorwoche" in tooltips. */
  previous: PeriodSummary
}

/** One point per ISO week (Mon–Sun) for the last `weeks` weeks, oldest first. */
export function weeklySeries(logs: WorkoutLog[], today: DateKey, weeks: number): WeekPoint[] {
  const currentWeek = startOfWeek(today)
  const weekSummary = (weekStart: DateKey) => summarize(logs, weekStart, addDays(weekStart, 6))
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = addDays(currentWeek, (index - weeks + 1) * 7)
    return { weekStart, isCurrent: weekStart === currentWeek, ...weekSummary(weekStart), previous: weekSummary(addDays(weekStart, -7)) }
  })
}

/**
 * Consecutive weeks with at least one training day, counted back from the current week.
 * An empty current week doesn't break the streak yet – it is still in progress.
 */
export function activeWeekStreak(logs: WorkoutLog[], today: DateKey): number {
  const activeWeeks = new Set(trainingDays(logs).map((log) => startOfWeek(log.date)))
  let week = startOfWeek(today)
  if (!activeWeeks.has(week)) week = addDays(week, -7)
  let streak = 0
  while (activeWeeks.has(week)) {
    streak += 1
    week = addDays(week, -7)
  }
  return streak
}

export interface MuscleShare {
  muscle: MuscleGroup
  sets: number
  share: number
}

/**
 * Training sets per muscle group (the standard way to measure muscle volume, independent of
 * rep ranges). Secondary muscles count as half a set when `includeSecondary` is on.
 */
export function muscleDistribution(logs: WorkoutLog[], from: DateKey, includeSecondary: boolean): MuscleShare[] {
  const sets = new Map<MuscleGroup, number>()
  const add = (muscle: MuscleGroup, value: number) => sets.set(muscle, (sets.get(muscle) ?? 0) + value)
  for (const log of logs) {
    if (log.date < from) continue
    for (const entry of log.entries) {
      const count = entry.sets.length
      add(entry.primaryMuscle, count)
      if (includeSecondary) for (const muscle of entry.secondaryMuscles) add(muscle, count / 2)
    }
  }
  const total = [...sets.values()].reduce((sum, value) => sum + value, 0)
  return [...sets.entries()]
    .map(([muscle, value]) => ({ muscle, sets: value, share: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.sets - a.sets)
}

export interface HeatmapDay {
  date: DateKey
  value: number
  /** All totals of the day, or `null` without a log. */
  totals: WorkoutTotals | null
  /** 0 = no training, 1–4 = quartile of the training days' values. */
  level: 0 | 1 | 2 | 3 | 4
}

/**
 * Calendar grid for the heatmap: `weeks` columns of 7 days (Mon–Sun), ending with the current
 * week. Levels are relative quartiles, so the map stays readable for beginners and pros alike.
 */
export function heatmapGrid(logs: WorkoutLog[], today: DateKey, weeks: number, metric: Metric): HeatmapDay[][] {
  const days = trainingDays(logs)
  const totalsByDate = new Map(days.map((log) => [log.date, log.totals]))
  const values = new Map(days.map((log) => [log.date, log.totals[metric]]))
  const sorted = [...values.values()].filter((value) => value > 0).sort((a, b) => a - b)
  // Nearest-rank quantile: of [2, 4, 6, 8] the lower quarter is 2, so each value gets its own level.
  const quantile = (q: number) => sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? 0
  const thresholds = [quantile(0.25), quantile(0.5), quantile(0.75)]

  const levelOf = (date: DateKey): HeatmapDay['level'] => {
    if (!values.has(date)) return 0
    const value = values.get(date) ?? 0
    // A logged day always shows, even with 0 volume (bodyweight-only day in volume mode).
    if (value <= thresholds[0]) return 1
    if (value <= thresholds[1]) return 2
    if (value <= thresholds[2]) return 3
    return 4
  }

  const firstMonday = addDays(startOfWeek(today), -(weeks - 1) * 7)
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = addDays(firstMonday, week * 7 + day)
      return { date, value: values.get(date) ?? 0, totals: totalsByDate.get(date) ?? null, level: date > today ? 0 : levelOf(date) }
    }),
  )
}

export interface ProgressPoint {
  date: DateKey
  /** Heaviest set of the session; `null` for bodyweight exercises. */
  bestWeightKg: number | null
  totalReps: number
}

/** One point per session of the given exercise, oldest first. */
export function exerciseProgress(logs: WorkoutLog[], exerciseId: string): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const log of logs) {
    for (const entry of log.entries) {
      if (entry.exerciseId !== exerciseId || entry.sets.length === 0) continue
      const weights = entry.sets.map((set) => set.weightKg).filter((weight): weight is number => weight !== null)
      points.push({
        date: log.date,
        bestWeightKg: weights.length > 0 ? Math.max(...weights) : null,
        totalReps: entry.sets.reduce((sum, set) => sum + set.reps, 0),
      })
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date))
}

export interface TrainedExercise {
  exerciseId: string
  sessions: number
}

/** Trained exercises with their session count, most frequent first. */
export function trainedExercises(logs: WorkoutLog[]): TrainedExercise[] {
  const counts = new Map<string, number>()
  for (const log of logs) {
    for (const entry of log.entries) if (entry.sets.length > 0) counts.set(entry.exerciseId, (counts.get(entry.exerciseId) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([exerciseId, sessions]) => ({ exerciseId, sessions }))
}

/** Days since the most recent training, or `null` if there is none. */
export function daysSinceLastWorkout(logs: WorkoutLog[], today: DateKey): number | null {
  const last = trainingDays(logs).reduce<DateKey | null>((latest, log) => (latest === null || log.date > latest ? log.date : latest), null)
  return last === null ? null : daysBetween(last, today)
}
