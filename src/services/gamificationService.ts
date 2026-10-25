import { ACHIEVEMENT_BY_ID, ACHIEVEMENTS, type AchievementDefinition, type ProgressMetrics } from '../data/achievements'
import { RANK_BY_ID, RANKS, type RankDefinition } from '../data/ranks'
import { addDays, toDateKey, todayKey } from '../lib/dates'
import { setLoadKg } from '../lib/workoutMath'
import type { AchievementId, DateKey, GamificationState, WorkoutLog } from '../types/models'

/**
 * Levels, ranks and achievements.
 *
 * Everything is derived from the workout logs on every change instead of awarding XP per
 * action: logs stay editable, so incremental XP could be farmed by deleting and re-adding sets
 * and would drift whenever a past day is corrected. Deriving keeps XP exact and idempotent across
 * devices; `users/{uid}` only stores the result (see `GamificationState`).
 *
 * A "completed workout" is a finished training day (before today) with at least one logged set
 * (one log per day).
 */

export const XP_REWARDS = {
  set: 15,
  workout: 150,
  /** Paid on every 3rd consecutive training day (day 3, 6, 9, … of a streak). */
  streakBonus: 500,
  /** Bonus for the weight moved: 1 XP per this many kg of a set's volume (reps × weight). */
  volumeKgPerXP: 20,
  /** At most this much volume bonus per set, so absurd weights can't farm XP. */
  volumeMaxPerSet: 15,
} as const

/** Volume bonus of one set, e.g. 12 reps with two 5 kg dumbbells = 120 kg → 6 XP. */
export function volumeXP(volumeKg: number): number {
  return Math.min(XP_REWARDS.volumeMaxPerSet, Math.floor(Math.max(0, volumeKg) / XP_REWARDS.volumeKgPerXP))
}

export const STREAK_BONUS_DAYS = 3

/** Workouts logged from this hour until midnight count as late (achievement "Nachteule"). */
export const LATE_WORKOUT_HOUR = 22

// Tuned for ~450 XP per workout at 3–4 workouts a week (plus a little volume bonus): Bronze after ~3 weeks, Gold after about
// a year, Grandmaster only after many years. The original brief's 500 · n^1.5 needed ~4.400
// workouts for Gold, which made everything above Silver unreachable.
const LEVEL_XP_BASE = 100
const LEVEL_XP_EXPONENT = 1.1

// ─── XP curve ────────────────────────────────────────────────────────────────

/** XP needed to get from `level` to `level + 1`: 100, 214, 334, 459, … */
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
  /** Bonus for the weight moved (`volumeXP` per set). */
  volume: number
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
  const xp: XPBreakdown = { sets: 0, volume: 0, workouts: 0, streaks: 0 }
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
    for (const entry of log.entries) for (const set of entry.sets) xp.volume += volumeXP(set.reps * setLoadKg(entry, set))
    xp.workouts += XP_REWARDS.workout
    if (streak % STREAK_BONUS_DAYS === 0) xp.streaks += XP_REWARDS.streakBonus

    for (const achievement of ACHIEVEMENTS) {
      if (!reachedOn[achievement.id] && metrics[achievement.metric] >= achievement.threshold) reachedOn[achievement.id] = log.date
    }
  }

  return { metrics, xp, totalXP: xp.sets + xp.volume + xp.workouts + xp.streaks, reachedOn }
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
  /** Finished days only (before `today`). */
  summary: ProgressSummary
  state: GamificationState
  progress: LevelProgress
  /** XP the still open day will add once it's over; not part of `summary` yet. */
  pendingXP: number
}

/**
 * Entry point after logs changed: the full picture for `logs`, merged with the stored state.
 *
 * Only finished days pay out. Today is still open, so an exercise added by mistake and deleted
 * again never earns XP, a level-up or an (ever lasting) achievement. Today's XP is reported as
 * pending and credited, with its toasts, on the next day.
 */
export function evaluateProgress(logs: WorkoutLog[], stored: GamificationState | null, today: DateKey = todayKey()): ProgressEvaluation {
  const finished = logs.filter((log) => log.date < today)
  const summary = summarizeProgress(finished)
  const pendingXP = finished.length === logs.length ? 0 : summarizeProgress(logs).totalXP - summary.totalXP
  return { summary, state: buildGamificationState(summary, stored), progress: levelProgress(summary.totalXP), pendingXP }
}
