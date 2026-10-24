import { ACHIEVEMENT_BY_ID, type AchievementDefinition } from '../data/achievements'
import type { AchievementId, DateKey, WorkoutLog } from '../types/models'
import { addDays, startOfWeek } from './dates'
import { recordImprovements, type RecordImprovement } from './records'
import { percentChange, summarize, type PeriodSummary } from './stats'

/** The recap of last week is offered from Monday until this weekday (0 = Monday). */
export const RECAP_LAST_WEEKDAY = 2

export interface WeeklyRecap {
  /** Monday of the week being reviewed. */
  weekStart: DateKey
  week: PeriodSummary
  previousWeek: PeriodSummary
  change: { days: number | null; sets: number | null; volumeKg: number | null }
  goalDays: number
  goalReached: boolean
  records: RecordImprovement[]
  achievements: AchievementDefinition[]
}

/** Beaten twice in one week: only the higher, final value counts. Input is chronological. */
const latestPerExercise = (improvements: RecordImprovement[]) => [
  ...new Map(improvements.map((improvement) => [improvement.exerciseId, improvement])).values(),
]

/**
 * Last week compared with the week before, for the card on Monday to Wednesday. `null` outside
 * that window or when neither week had any training (nothing worth showing).
 */
export function weeklyRecap(
  logs: WorkoutLog[],
  unlockedAchievements: Record<AchievementId, DateKey>,
  goalDays: number,
  today: DateKey,
): WeeklyRecap | null {
  const thisWeek = startOfWeek(today)
  const weekday = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${thisWeek}T12:00:00`).getTime()) / 86_400_000)
  if (weekday > RECAP_LAST_WEEKDAY) return null

  const weekStart = addDays(thisWeek, -7)
  const weekEnd = addDays(weekStart, 6)
  const week = summarize(logs, weekStart, weekEnd)
  const previousWeek = summarize(logs, addDays(weekStart, -7), addDays(weekStart, -1))
  if (week.days === 0 && previousWeek.days === 0) return null

  const inWeek = (date: DateKey) => date >= weekStart && date <= weekEnd
  return {
    weekStart,
    week,
    previousWeek,
    change: {
      days: percentChange(week.days, previousWeek.days),
      sets: percentChange(week.sets, previousWeek.sets),
      volumeKg: percentChange(week.volumeKg, previousWeek.volumeKg),
    },
    goalDays,
    goalReached: week.days >= goalDays,
    records: latestPerExercise(recordImprovements(logs).filter((improvement) => inWeek(improvement.date))),
    achievements: Object.entries(unlockedAchievements)
      .filter(([, date]) => inWeek(date))
      .flatMap(([id]) => ACHIEVEMENT_BY_ID.get(id) ?? []),
  }
}
