import { MUSCLE_REGION, type BodyRegion } from '../data/muscleGroups'
import type { DateKey, Exercise, WorkoutLog } from '../types/models'
import { groupByRegion } from './catalogSections'

export interface RegionSuggestion {
  region: BodyRegion
  /** The last day with a logged set for this region, `null` if never. */
  lastDate: DateKey | null
  /** Its muscles in body order ("Rücken, Bizeps"). */
  muscles: string
  /** Up to three exercises to start with, in catalog order (easy and effective first). */
  exercises: Exercise[]
}

const SUGGESTED_EXERCISES = 3

/**
 * What an empty training day suggests: the body region that has waited longest since its last
 * logged set. Regions never trained come first, in catalog order (so a new user starts with
 * pulling: Bizeps-Curls). `catalog` is the exercises the user may add (a guest's unlocked ones).
 */
export function suggestRegion(logs: WorkoutLog[], catalog: Exercise[], before: DateKey): RegionSuggestion | null {
  const lastByRegion = new Map<BodyRegion, DateKey>()
  for (const log of logs) {
    if (log.date >= before) continue
    for (const entry of log.entries) {
      if (entry.sets.length === 0) continue
      const region = MUSCLE_REGION[entry.primaryMuscle]
      const known = lastByRegion.get(region)
      if (!known || log.date > known) lastByRegion.set(region, log.date)
    }
  }
  const candidates = groupByRegion(catalog).map((section) => ({
    region: section.region,
    lastDate: lastByRegion.get(section.region) ?? null,
    muscles: section.muscles,
    exercises: section.exercises.slice(0, SUGGESTED_EXERCISES),
  }))
  // Stable sort: never trained first (in catalog order), then the oldest last session.
  candidates.sort((a, b) => (a.lastDate ?? '').localeCompare(b.lastDate ?? ''))
  return candidates[0] ?? null
}
