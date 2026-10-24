import { buildWorkoutLog } from '../lib/workoutMath'
import type { DateKey, MuscleGroup, WorkoutEntry, WorkoutLog } from '../types/models'

let counter = 0
const nextId = () => `id-${++counter}`

/** An entry with `sets` × `reps` at `weightKg` (null = bodyweight). */
export function entry(
  exerciseId: string,
  sets: number,
  reps: number,
  weightKg: number | null = null,
  muscles: { primary?: MuscleGroup; secondary?: MuscleGroup[] } = {},
): WorkoutEntry {
  return {
    id: nextId(),
    exerciseId,
    exerciseName: exerciseId,
    primaryMuscle: muscles.primary ?? 'chest',
    secondaryMuscles: muscles.secondary ?? [],
    usesWeight: weightKg !== null,
    sets: Array.from({ length: sets }, () => ({ id: nextId(), reps, weightKg })),
    position: 0,
  }
}

/** A full day document as the app stores it (totals computed), logged at `hour` local time. */
export function log(date: DateKey, entries: WorkoutEntry[], hour = 18): WorkoutLog {
  const built = buildWorkoutLog('user-1', date, entries, null)
  const at = new Date(`${date}T${String(hour).padStart(2, '0')}:30:00`).getTime()
  return { ...built, createdAt: at, updatedAt: at }
}

/** A training day with `sets` sets of 10 reps at `weightKg`. */
export const day = (date: DateKey, sets = 3, weightKg: number | null = 20, hour = 18) =>
  log(date, [entry('bench', sets, 10, weightKg)], hour)
