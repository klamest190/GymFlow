import { CalendarCheck, Flame, Footprints, Layers, Moon, Trophy, Weight, Zap, type LucideIcon } from 'lucide-react'
import type { AchievementId } from '../types/models'

/**
 * Running totals over the whole training history, computed day by day in
 * `services/gamificationService.ts`. Every achievement is a threshold on one of them.
 */
export interface ProgressMetrics {
  /** Training days with at least one logged set. */
  workouts: number
  sets: number
  volumeKg: number
  /** Longest run of consecutive training days. */
  longestStreak: number
  /** Most workouts within a single calendar month. */
  bestMonthWorkouts: number
  /** Workouts logged on their own day at or after `LATE_WORKOUT_HOUR`. */
  lateWorkouts: number
}

/** Unit for the progress label of locked badges ("4 / 10 Workouts"). */
export type AchievementUnit = 'days' | 'kg' | 'workouts' | 'sets'

/** Title and description are texts: `messages().gamification.achievements[id]`. */
export interface AchievementDefinition {
  /** Stored in `users/{uid}.unlockedAchievements`, so never rename an existing ID. */
  id: AchievementId
  icon: LucideIcon
  metric: keyof ProgressMetrics
  /** Unlocks once `metric >= threshold`. */
  threshold: number
  /** Omitted for one-off goals. */
  unit?: AchievementUnit
}

const DEFINITIONS = [
  { id: 'first-workout', icon: Footprints, metric: 'workouts', threshold: 1 },
  { id: 'iron-will', icon: Flame, metric: 'longestStreak', threshold: 3, unit: 'days' },
  { id: 'night-owl', icon: Moon, metric: 'lateWorkouts', threshold: 1 },
  { id: 'volume-monster', icon: Weight, metric: 'volumeKg', threshold: 10_000, unit: 'kg' },
  { id: 'consistency-king', icon: CalendarCheck, metric: 'bestMonthWorkouts', threshold: 10, unit: 'workouts' },
  { id: 'unstoppable', icon: Zap, metric: 'longestStreak', threshold: 7, unit: 'days' },
  { id: 'set-collector', icon: Layers, metric: 'sets', threshold: 500, unit: 'sets' },
  { id: 'centurion', icon: Trophy, metric: 'workouts', threshold: 100, unit: 'workouts' },
] as const satisfies readonly AchievementDefinition[]

export type KnownAchievementId = (typeof DEFINITIONS)[number]['id']

export const ACHIEVEMENTS: readonly AchievementDefinition[] = DEFINITIONS

export const ACHIEVEMENT_BY_ID = new Map<AchievementId, AchievementDefinition>(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]))
