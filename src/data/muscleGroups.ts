import type { Difficulty, MuscleGroup } from '../types/models'

// The names of muscle groups, regions, equipment, categories and difficulty levels are texts:
// `messages().catalog` (src/i18n/messages/catalog.ts).

/**
 * Twelve muscle groups are too many for a categorical palette, so colors name the body region
 * in competition-plate colors (validated set in index.css → --region-*), in this fixed order.
 */
export type BodyRegion = 'push' | 'pull' | 'core' | 'legs'

export const BODY_REGIONS: BodyRegion[] = ['push', 'pull', 'core', 'legs']

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

/** Position on the three-step difficulty scale (1 = easiest). */
export const DIFFICULTY_LEVELS: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
}
