import { useMemo, useState } from 'react'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useLogsInRange, useProfile } from '../../hooks/useData'
import { useUserId } from '../../hooks/useSession'
import { useIsDesktop } from '../../hooks/useUi'
import { addDays, daysBetween, startOfWeek, todayKey } from '../../lib/dates'
import { activeWeekStreak, METRIC_SHORT_LABELS, summarize, weeklySeries, type Metric } from '../../lib/stats'
import { ActivityHeatmap } from './ActivityHeatmap'
import { ExerciseProgress, PersonalRecords } from './ExerciseProgress'
import { KpiTiles } from './KpiTiles'
import { MuscleDistribution } from './MuscleDistribution'
import { WeeklyChart } from './WeeklyChart'

/** One year of logs feeds every chart (at most 365 small documents). */
const HISTORY_DAYS = 365
const METRICS: Metric[] = ['reps', 'sets', 'volumeKg']

export function StatsDashboard() {
  const userId = useUserId()
  const today = todayKey()
  const { logs, ready } = useLogsInRange(userId, addDays(today, -(HISTORY_DAYS - 1)), today)
  const profile = useProfile(userId)
  const isDesktop = useIsDesktop()
  const [metric, setMetric] = useState<Metric>('reps')

  const stats = useMemo(() => {
    const weekStart = startOfWeek(today)
    const lastWeekStart = addDays(weekStart, -7)
    // Compare against the same weekdays of last week, so Monday isn't measured against a full week.
    const elapsedDays = daysBetween(weekStart, today)
    return {
      thisWeek: summarize(logs, weekStart, today),
      lastWeekToDate: summarize(logs, lastWeekStart, addDays(lastWeekStart, elapsedDays)),
      weekStreak: activeWeekStreak(logs, today),
      weeks: weeklySeries(logs, today, 12),
    }
  }, [logs, today])

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Letzte 12 Monate</p>
          <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">Statistik</h1>
        </div>
        <div className="w-full sm:w-72">
          <SegmentedControl
            label="Kennzahl"
            value={metric}
            onChange={setMetric}
            options={METRICS.map((value) => ({ value, label: METRIC_SHORT_LABELS[value] }))}
          />
        </div>
      </header>

      {!ready ? (
        <div className="mt-6 grid gap-4 lg:mt-8 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`glass h-40 animate-pulse rounded-3xl ${index === 0 ? 'lg:col-span-3 h-28' : ''}`} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4 lg:mt-8 lg:space-y-5">
          <KpiTiles
            thisWeek={stats.thisWeek}
            lastWeekToDate={stats.lastWeekToDate}
            weeklyGoalDays={profile.weeklyGoalDays}
            weekStreak={stats.weekStreak}
          />
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            <WeeklyChart weeks={stats.weeks} metric={metric} className="lg:col-span-2" />
            <MuscleDistribution logs={logs} />
          </div>
          {/* A full year on desktop; half a year keeps the cells tappable on phones. */}
          <ActivityHeatmap logs={logs} metric={metric} weeks={isDesktop ? 53 : 26} />
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            <ExerciseProgress logs={logs} className="lg:col-span-2" />
            <PersonalRecords logs={logs} />
          </div>
        </div>
      )}
    </div>
  )
}
