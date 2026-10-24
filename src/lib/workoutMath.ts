import type { DateKey, Exercise, MuscleGroup, WorkoutEntry, WorkoutLog, WorkoutSet, WorkoutTotals } from '../types/models'

export const createId = () => crypto.randomUUID()

export function createSet(reps: number, weightKg: number | null = null): WorkoutSet {
  return { id: createId(), reps, weightKg }
}

/** Weight one repetition of the set moves: both dumbbells for a per-dumbbell entry. */
export const setLoadKg = (entry: Pick<WorkoutEntry, 'perDumbbell'>, set: WorkoutSet) => (set.weightKg ?? 0) * (entry.perDumbbell ? 2 : 1)

export function createEntry(exercise: Exercise, position: number): WorkoutEntry {
  return {
    id: createId(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles,
    usesWeight: exercise.usesWeight,
    perDumbbell: exercise.equipment === 'dumbbell',
    sets: Array.from({ length: exercise.defaultSets }, () => createSet(exercise.defaultReps)),
    position,
  }
}

export function computeTotals(entries: WorkoutEntry[]): WorkoutTotals {
  return entries.reduce<WorkoutTotals>(
    (totals, entry) => {
      totals.exercises += 1
      for (const set of entry.sets) {
        totals.sets += 1
        totals.reps += set.reps
        totals.volumeKg += set.reps * setLoadKg(entry, set)
      }
      return totals
    },
    { exercises: 0, sets: 0, reps: 0, volumeKg: 0 },
  )
}

export function computeMuscleGroupReps(entries: WorkoutEntry[]): Partial<Record<MuscleGroup, number>> {
  const result: Partial<Record<MuscleGroup, number>> = {}
  for (const entry of entries) {
    const reps = entry.sets.reduce((sum, set) => sum + set.reps, 0)
    result[entry.primaryMuscle] = (result[entry.primaryMuscle] ?? 0) + reps
  }
  return result
}

/** Builds the full log document, including the pre-aggregated fields the dashboard reads. */
export function buildWorkoutLog(
  userId: string,
  date: DateKey,
  entries: WorkoutEntry[],
  previous: WorkoutLog | null,
): WorkoutLog {
  const now = Date.now()
  const ordered = entries.map((entry, position) => ({ ...entry, position }))
  return {
    id: date,
    userId,
    date,
    entries: ordered,
    totals: computeTotals(ordered),
    muscleGroupReps: computeMuscleGroupReps(ordered),
    ...(previous?.note ? { note: previous.note } : {}),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }
}
