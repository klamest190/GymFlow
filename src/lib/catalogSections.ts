import { MUSCLE_GROUP_LABELS, MUSCLE_REGION, type BodyRegion } from '../data/muscleGroups'
import { MUSCLE_GROUPS, type Exercise } from '../types/models'

export interface RegionSection {
  region: BodyRegion
  /** The primary muscles of the section's exercises, in body order ("Rücken, Bizeps"). */
  muscles: string
  exercises: Exercise[]
}

/**
 * The exercises grouped by body region, each group in catalog order. The groups follow their
 * first exercise, so the easy and effective start (Bizeps-Curls) stays at the top.
 */
export function groupByRegion(exercises: Exercise[]): RegionSection[] {
  const sections = new Map<BodyRegion, Exercise[]>()
  for (const exercise of exercises) {
    const region = MUSCLE_REGION[exercise.primaryMuscle]
    sections.set(region, [...(sections.get(region) ?? []), exercise])
  }
  return [...sections].map(([region, list]) => ({
    region,
    muscles: MUSCLE_GROUPS.filter((group) => list.some((exercise) => exercise.primaryMuscle === group))
      .map((group) => MUSCLE_GROUP_LABELS[group])
      .join(', '),
    exercises: list,
  }))
}
