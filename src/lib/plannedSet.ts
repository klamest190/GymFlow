import type { DateKey, WorkoutEntry } from '../types/models'
import type { ExerciseSession } from './exerciseHistory'

/** Starting values of the next set the tracker opens. Never stored; logging it creates a real set. */
export interface PlannedSet {
  reps: number
  weightKg: number | null
}

/** The latest session of the exercise before `date` (history is newest first). */
export function lastSessionBefore(history: Map<string, ExerciseSession[]>, exerciseId: string, date: DateKey): ExerciseSession | null {
  return history.get(exerciseId)?.find((session) => session.date < date) ?? null
}

/**
 * Values for the next set of `entry`: set n of the last session, else the template's plan (only
 * without a last session), else a copy of today's last set, else `fallback` for a new exercise.
 */
export function nextPlannedSet(
  entry: WorkoutEntry,
  previous: WorkoutEntry | null,
  fallback: { reps: number; weightKg: number | null },
): PlannedSet {
  const index = entry.sets.length
  const plan = previous?.sets ?? entry.plannedSets
  const planned = plan?.[index]
  if (planned) {
    // Old entries stored the total of both dumbbells: their weight would mislead, their reps don't.
    const sameUnit = !previous || Boolean(previous.perDumbbell) === Boolean(entry.perDumbbell)
    return { reps: planned.reps, weightKg: sameUnit ? planned.weightKg : fallback.weightKg }
  }
  const last = entry.sets.at(-1)
  if (last) return { reps: last.reps, weightKg: last.weightKg }
  return { ...fallback }
}
