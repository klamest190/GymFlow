import { useMemo } from 'react'
import { addDays, daysBetween, startOfWeek, todayKey } from '../lib/dates'
import { activeWeekStreak, percentChange, summarize, weeklySeries, type Metric, type PeriodSummary } from '../lib/stats'
import { useLogsInRange } from './useData'

/** One year of logs feeds every chart (at most 365 small, pre-aggregated documents). */
export const STATS_HISTORY_DAYS = 365
const CHART_WEEKS = 12

export interface Trend {
  current: number
  previous: number
  /** Rounded percent change, or `null` when last week has nothing to compare against. */
  change: number | null
}

export interface WeekComparison {
  thisWeek: PeriodSummary
  /** Same weekdays of last week (Mon → today's weekday), so a running week is compared fairly. */
  lastWeekToDate: PeriodSummary
  trends: Record<Metric, Trend>
}

/**
 * Everything the statistics dashboard shows, derived from one live Firestore subscription.
 * Each workout log already carries its day totals, so aggregation is a cheap pass in memory.
 */
export function useWorkoutStats(userId: string) {
  const today = todayKey()
  const { logs, ready } = useLogsInRange(userId, addDays(today, -(STATS_HISTORY_DAYS - 1)), today)

  const stats = useMemo(() => {
    const weekStart = startOfWeek(today)
    const lastWeekStart = addDays(weekStart, -7)
    const thisWeek = summarize(logs, weekStart, today)
    const lastWeekToDate = summarize(logs, lastWeekStart, addDays(lastWeekStart, daysBetween(weekStart, today)))
    const trend = (metric: Metric): Trend => ({
      current: thisWeek[metric],
      previous: lastWeekToDate[metric],
      change: percentChange(thisWeek[metric], lastWeekToDate[metric]),
    })
    const week: WeekComparison = {
      thisWeek,
      lastWeekToDate,
      trends: { reps: trend('reps'), sets: trend('sets'), volumeKg: trend('volumeKg') },
    }
    return {
      week,
      weekStreak: activeWeekStreak(logs, today),
      weeks: weeklySeries(logs, today, CHART_WEEKS),
    }
  }, [logs, today])

  return { logs, ready, ...stats }
}
