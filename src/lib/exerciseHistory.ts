import type { DateKey, WorkoutEntry, WorkoutLog } from '../types/models'

export interface ExerciseSession {
  date: DateKey
  entry: WorkoutEntry
}

/** Sessions per exercise ID, newest first. An exercise added without a logged set is no session. */
export function buildExerciseHistory(logs: WorkoutLog[]): Map<string, ExerciseSession[]> {
  const history = new Map<string, ExerciseSession[]>()
  for (const log of logs) {
    for (const entry of log.entries) {
      if (entry.sets.length === 0) continue
      const sessions = history.get(entry.exerciseId) ?? []
      sessions.push({ date: log.date, entry })
      history.set(entry.exerciseId, sessions)
    }
  }
  for (const sessions of history.values()) sessions.sort((a, b) => b.date.localeCompare(a.date))
  return history
}

const kg = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

/** "3 × 10 · 60 kg" when all sets match, otherwise "3 Sätze · bis 65 kg". */
export function summarizeSets(entry: WorkoutEntry): string {
  const { sets } = entry
  if (sets.length === 0) return 'Keine Sätze'
  const uniformReps = sets.every((set) => set.reps === sets[0].reps)
  const weights = sets.map((set) => set.weightKg).filter((weight): weight is number => weight !== null)
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null
  const uniformWeight = weights.length === sets.length && weights.every((weight) => weight === weights[0])

  const volume = uniformReps ? `${sets.length} × ${sets[0].reps}` : `${sets.length} Sätze`
  if (maxWeight === null) return volume
  return `${volume} · ${uniformWeight ? '' : 'bis '}${kg.format(maxWeight)} kg`
}

/**
 * The tracker's "Letztes Mal": every rep count, because with one pair of dumbbells progress shows in
 * the reps. "12, 10, 8 Wdh. mit 8 kg", "3 × 10 Wdh. mit 8 kg", or per set if the weight changed.
 */
export function formatLastTime(entry: WorkoutEntry): string {
  const { sets } = entry
  const firstWeight = sets[0]?.weightKg ?? null
  if (!sets.every((set) => set.weightKg === firstWeight)) {
    return sets.map((set) => (set.weightKg === null ? `${set.reps} Wdh.` : `${set.reps} × ${formatKg(set.weightKg)}`)).join(', ')
  }
  const reps = sets.every((set) => set.reps === sets[0].reps) && sets.length > 1 ? `${sets.length} × ${sets[0].reps}` : sets.map((set) => set.reps).join(', ')
  return firstWeight === null ? `${reps} Wdh.` : `${reps} Wdh. mit ${formatKg(firstWeight)}`
}

/** Heaviest weight ever logged for the exercise, or `null` for bodyweight-only history. */
export function bestWeight(sessions: ExerciseSession[]): number | null {
  let best: number | null = null
  for (const { entry } of sessions) {
    for (const set of entry.sets) {
      if (set.weightKg !== null && (best === null || set.weightKg > best)) best = set.weightKg
    }
  }
  return best
}

export const formatKg = (value: number) => `${kg.format(value)} kg`
