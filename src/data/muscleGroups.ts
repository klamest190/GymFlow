import type { Difficulty, Equipment, ExerciseCategory, MuscleGroup } from '../types/models'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  forearms: 'Unterarme',
  core: 'Bauch',
  obliques: 'Seitl. Bauch',
  quads: 'Beine vorn',
  hamstrings: 'Beine hinten',
  glutes: 'Gesäß',
  calves: 'Waden',
}

/**
 * Twelve muscle groups are too many for a categorical palette, so colors name the body region
 * in competition-plate colors (validated set in index.css → --region-*), in this fixed order.
 */
export type BodyRegion = 'push' | 'pull' | 'core' | 'legs'

export const BODY_REGIONS: BodyRegion[] = ['push', 'pull', 'core', 'legs']

export const REGION_LABELS: Record<BodyRegion, string> = {
  push: 'Drücken',
  pull: 'Ziehen',
  core: 'Rumpf',
  legs: 'Beine',
}

/** Tailwind background class per region. */
export const REGION_TINTS: Record<BodyRegion, string> = {
  push: 'bg-region-push',
  pull: 'bg-region-pull',
  core: 'bg-region-core',
  legs: 'bg-region-legs',
}

export const MUSCLE_REGION: Record<MuscleGroup, BodyRegion> = {
  chest: 'push',
  shoulders: 'push',
  triceps: 'push',
  back: 'pull',
  biceps: 'pull',
  forearms: 'pull',
  core: 'core',
  obliques: 'core',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
}

/** Small colored dot / chip per muscle group: the region's color, with the muscle's label beside it. */
export const MUSCLE_GROUP_TINTS = Object.fromEntries(
  Object.entries(MUSCLE_REGION).map(([muscle, region]) => [muscle, REGION_TINTS[region]]),
) as Record<MuscleGroup, string>

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  machine: 'Maschine',
  cable: 'Kabelzug',
  bodyweight: 'Körpergewicht',
  kettlebell: 'Kettlebell',
  band: 'Band',
  other: 'Sonstiges',
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Kraft',
  core: 'Core',
  cardio: 'Cardio',
  mobility: 'Mobility',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Einsteiger',
  intermediate: 'Fortgeschritten',
  advanced: 'Profi',
}
