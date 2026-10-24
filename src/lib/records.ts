import type { DateKey, WorkoutLog } from '../types/models'

/** Heaviest set for weighted exercises, most reps in one set for bodyweight exercises. */
export type RecordKind = 'weight' | 'reps'

export interface RecordImprovement {
  exerciseId: string
  exerciseName: string
  kind: RecordKind
  value: number
  /** Best value before this day. */
  previous: number
  date: DateKey
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  kind: RecordKind
  value: number
  /** First day the value was reached. */
  date: DateKey
}

/**
 * Walks the history chronologically and lists every day an exercise's best was beaten.
 * The very first session of an exercise sets the baseline and is not an improvement.
 */
export function recordImprovements(logs: WorkoutLog[]): RecordImprovement[] {
  const best = new Map<string, number>()
  const improvements: RecordImprovement[] = []
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const entry of log.entries) {
      const kind: RecordKind = entry.usesWeight ? 'weight' : 'reps'
      const dayBest = Math.max(0, ...entry.sets.map((set) => (kind === 'weight' ? (set.weightKg ?? 0) : set.reps)))
      if (dayBest <= 0) continue
      const key = `${entry.exerciseId}:${kind}`
      const previous = best.get(key)
      if (previous === undefined) best.set(key, dayBest)
      else if (dayBest > previous) {
        best.set(key, dayBest)
        improvements.push({ exerciseId: entry.exerciseId, exerciseName: entry.exerciseName, kind, value: dayBest, previous, date: log.date })
      }
    }
  }
  return improvements
}

/** Current best per exercise (keyed by exercise ID). */
export function personalRecords(logs: WorkoutLog[]): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>()
  for (const log of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const entry of log.entries) {
      const kind: RecordKind = entry.usesWeight ? 'weight' : 'reps'
      for (const set of entry.sets) {
        const value = kind === 'weight' ? (set.weightKg ?? 0) : set.reps
        const current = records.get(entry.exerciseId)
        if (value > 0 && (!current || value > current.value)) {
          records.set(entry.exerciseId, { exerciseId: entry.exerciseId, exerciseName: entry.exerciseName, kind, value, date: log.date })
        }
      }
    }
  }
  return records
}

export interface NewRecord {
  record: PersonalRecord
  previous: number
}

/** Records that went up from `previous` to `next`; exercises done for the first time don't count. */
export function detectNewRecords(previous: Map<string, PersonalRecord>, next: Map<string, PersonalRecord>): NewRecord[] {
  const found: NewRecord[] = []
  for (const [exerciseId, record] of next) {
    const before = previous.get(exerciseId)
    if (before && before.kind === record.kind && record.value > before.value) found.push({ record, previous: before.value })
  }
  return found
}

const kg = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

/** "62,5 kg" or "15 Wdh." */
export const formatRecordValue = (kind: RecordKind, value: number) => (kind === 'weight' ? `${kg.format(value)} kg` : `${value} Wdh.`)
