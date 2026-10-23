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

export interface AchievementDefinition {
  /** Stored in `users/{uid}.unlockedAchievements`, so never rename an existing ID. */
  id: AchievementId
  title: string
  description: string
  icon: LucideIcon
  metric: keyof ProgressMetrics
  /** Unlocks once `metric >= threshold`. */
  threshold: number
  /** Unit for the progress label of locked badges ("4 / 10 Workouts"); omitted for one-off goals. */
  unit?: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-workout', title: 'Erster Schritt', description: 'Dein erstes Workout geloggt', icon: Footprints, metric: 'workouts', threshold: 1 },
  { id: 'iron-will', title: 'Eisenwille', description: '3 Tage in Folge trainiert', icon: Flame, metric: 'longestStreak', threshold: 3, unit: 'Tage' },
  { id: 'night-owl', title: 'Nachteule', description: 'Workout nach 22:00 Uhr geloggt', icon: Moon, metric: 'lateWorkouts', threshold: 1 },
  { id: 'volume-monster', title: 'Volumen-Monster', description: 'Insgesamt 10.000 kg bewegt', icon: Weight, metric: 'volumeKg', threshold: 10_000, unit: 'kg' },
  { id: 'consistency-king', title: 'Konsistenz-König', description: '10 Workouts in einem Monat', icon: CalendarCheck, metric: 'bestMonthWorkouts', threshold: 10, unit: 'Workouts' },
  { id: 'unstoppable', title: 'Unaufhaltsam', description: '7 Tage in Folge trainiert', icon: Zap, metric: 'longestStreak', threshold: 7, unit: 'Tage' },
  { id: 'set-collector', title: 'Satz-Sammler', description: '500 Sätze geloggt', icon: Layers, metric: 'sets', threshold: 500, unit: 'Sätze' },
  { id: 'centurion', title: 'Centurion', description: '100 Workouts abgeschlossen', icon: Trophy, metric: 'workouts', threshold: 100, unit: 'Workouts' },
]

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]))
