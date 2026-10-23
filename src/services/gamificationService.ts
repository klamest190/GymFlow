import { ACHIEVEMENT_BY_ID, ACHIEVEMENTS, type AchievementDefinition, type ProgressMetrics } from '../data/achievements'
import { RANK_BY_ID, RANKS, type RankDefinition } from '../data/ranks'
import { addDays, toDateKey } from '../lib/dates'
import type { AchievementId, DateKey, GamificationState, WorkoutLog } from '../types/models'

/**
 * Levels, ranks and achievements.
 *
 * Everything is derived from the workout logs on every change instead of awarding XP per
 * action: logs stay editable, so incremental XP could be farmed by deleting and re-adding sets
 * and would drift whenever a past day is corrected. Deriving keeps XP exact and idempotent across
 * devices; `users/{uid}` only stores the result (see `GamificationState`).
 *
 * A "completed workout" is a training day with at least one logged set (one log per day).
 */

export const XP_REWARDS = {
  set: 15,
  workout: 150,
  /** Paid on every 3rd consecutive training day (day 3, 6, 9, … of a streak). */
  streakBonus: 500,
} as const

export const STREAK_BONUS_DAYS = 3

/** Workouts logged from this hour until midnight count as late (achievement "Nachteule"). */
export const LATE_WORKOUT_HOUR = 22

const LEVEL_XP_BASE = 500
const LEVEL_XP_EXPONENT = 1.5

// ─── XP curve ────────────────────────────────────────────────────────────────

/** XP needed to get from `level` to `level + 1`: 500, 1.414, 2.598, 4.000, … */
export function xpForNextLevel(level: number): number {
  return Math.floor(LEVEL_XP_BASE * Math.pow(level, LEVEL_XP_EXPONENT))
}

export interface LevelProgress {
  level: number
  /** XP earned inside the current level. */
  currentXP: number
  /** XP the current level needs in total (`xpForNextLevel(level)`). */
  requiredXP: number
  /** `currentXP / requiredXP`, 0–1. */
  ratio: number
}

export function levelProgress(totalXP: number): LevelProgress {
  let level = 1
  let remaining = Number.isFinite(totalXP) ? Math.max(0, Math.floor(totalXP)) : 0
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level)
    level += 1
  }
  const requiredXP = xpForNextLevel(level)
  return { level, currentXP: remaining, requiredXP, ratio: remaining / requiredXP }
}

export function rankForLevel(level: number): RankDefinition {
  let rank = RANKS[0]
  for (const candidate of RANKS) if (level >= candidate.minLevel) rank = candidate
  return rank
}

/** The rank after `rank`, or `null` at the top. */
export function nextRank(rank: RankDefinition): RankDefinition | null {
  return RANKS[RANKS.indexOf(rank) + 1] ?? null
}

// ─── History → metrics, XP and unlock dates ──────────────────────────────────

export interface XPBreakdown {
  sets: number
  workouts: number
  streaks: number
}

export interface ProgressSummary {
  metrics: ProgressMetrics
  /** Earned XP per source. */
  xp: XPBreakdown
  totalXP: number
  /** First training day on which each achievement's threshold was met. */
  reachedOn: Record<AchievementId, DateKey>
}

const emptyMetrics = (): ProgressMetrics => ({
  workouts: 0,
  sets: 0,
  volumeKg: 0,
  longestStreak: 0,
  bestMonthWorkouts: 0,
  lateWorkouts: 0,
})

/**
 * Whether the day was logged late on that same day. Both timestamps count: `createdAt` is the
 * first entry, `updatedAt` the last edit, so a workout that runs past 22:00 qualifies too.
 * Editing an old day late in the evening doesn't, because the date wouldn't match.
 */
function isLateWorkout(log: WorkoutLog): boolean {
  return [log.createdAt, log.updatedAt].some((timestamp) => {
    const time = new Date(timestamp)
    return toDateKey(time) === log.date && time.getHours() >= LATE_WORKOUT_HOUR
  })
}

/** Walks the history chronologically once, accumulating metrics and XP day by day. */
export function summarizeProgress(logs: WorkoutLog[]): ProgressSummary {
  const days = logs.filter((log) => log.totals.sets > 0).sort((a, b) => a.date.localeCompare(b.date))
  const metrics = emptyMetrics()
  const xp: XPBreakdown = { sets: 0, workouts: 0, streaks: 0 }
  const workoutsPerMonth = new Map<string, number>()
  const reachedOn: Record<AchievementId, DateKey> = {}
  let streak = 0
  let previousDate: DateKey | null = null

  for (const log of days) {
    streak = previousDate !== null && addDays(previousDate, 1) === log.date ? streak + 1 : 1
    previousDate = log.date

    const month = log.date.slice(0, 7)
    const monthWorkouts = (workoutsPerMonth.get(month) ?? 0) + 1
    workoutsPerMonth.set(month, monthWorkouts)

    metrics.workouts += 1
    metrics.sets += log.totals.sets
    metrics.volumeKg += log.totals.volumeKg
    metrics.longestStreak = Math.max(metrics.longestStreak, streak)
    metrics.bestMonthWorkouts = Math.max(metrics.bestMonthWorkouts, monthWorkouts)
    if (isLateWorkout(log)) metrics.lateWorkouts += 1

    xp.sets += log.totals.sets * XP_REWARDS.set
    xp.workouts += XP_REWARDS.workout
    if (streak % STREAK_BONUS_DAYS === 0) xp.streaks += XP_REWARDS.streakBonus

    for (const achievement of ACHIEVEMENTS) {
      if (!reachedOn[achievement.id] && metrics[achievement.metric] >= achievement.threshold) reachedOn[achievement.id] = log.date
    }
  }

  return { metrics, xp, totalXP: xp.sets + xp.workouts + xp.streaks, reachedOn }
}

/** Progress of a (locked) achievement towards its threshold. */
export function achievementProgress(achievement: AchievementDefinition, metrics: ProgressMetrics) {
  const value = Math.min(metrics[achievement.metric], achievement.threshold)
  return { value, ratio: value / achievement.threshold }
}

// ─── State and change detection ──────────────────────────────────────────────

/**
 * The state to store for `summary`. Achievements unlocked earlier stay unlocked with their
 * original date, even if the logs that earned them were deleted since; XP and level don't.
 */
export function buildGamificationState(summary: ProgressSummary, previous: GamificationState | null): GamificationState {
  const { level, currentXP } = levelProgress(summary.totalXP)
  return {
    currentXP,
    totalXP: summary.totalXP,
    level,
    rank: rankForLevel(level).id,
    unlockedAchievements: { ...summary.reachedOn, ...previous?.unlockedAchievements },
  }
}

export function isSameState(a: GamificationState, b: GamificationState): boolean {
  const unlockedA = Object.entries(a.unlockedAchievements)
  return (
    a.totalXP === b.totalXP &&
    a.currentXP === b.currentXP &&
    a.level === b.level &&
    a.rank === b.rank &&
    unlockedA.length === Object.keys(b.unlockedAchievements).length &&
    unlockedA.every(([id, date]) => b.unlockedAchievements[id] === date)
  )
}

export type ProgressEvent =
  | { kind: 'level-up'; level: number; rank: RankDefinition; rankUp: boolean; xpToNext: number }
  | { kind: 'achievement'; achievement: AchievementDefinition }

/** What to celebrate when going from `previous` to `next`. Losses (deleted logs) stay silent. */
export function detectProgressEvents(previous: GamificationState, next: GamificationState): ProgressEvent[] {
  const events: ProgressEvent[] = []
  if (next.level > previous.level) {
    events.push({
      kind: 'level-up',
      level: next.level,
      rank: RANK_BY_ID[next.rank],
      rankUp: RANK_BY_ID[next.rank].minLevel > RANK_BY_ID[previous.rank].minLevel,
      xpToNext: xpForNextLevel(next.level) - next.currentXP,
    })
  }
  for (const id of Object.keys(next.unlockedAchievements)) {
    const achievement = ACHIEVEMENT_BY_ID.get(id)
    if (achievement && !previous.unlockedAchievements[id]) events.push({ kind: 'achievement', achievement })
  }
  return events
}

export interface ProgressEvaluation {
  summary: ProgressSummary
  state: GamificationState
  progress: LevelProgress
}

/** Entry point after logs changed: the full picture for `logs`, merged with the stored state. */
export function evaluateProgress(logs: WorkoutLog[], stored: GamificationState | null): ProgressEvaluation {
  const summary = summarizeProgress(logs)
  return { summary, state: buildGamificationState(summary, stored), progress: levelProgress(summary.totalXP) }
}
