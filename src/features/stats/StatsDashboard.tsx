import { useState } from 'react'
import { useSession } from '../../auth/authContext'
import { Loadable } from '../../components/ui/Loadable'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useIsDesktop } from '../../hooks/useUi'
import { useWorkoutStats } from '../../hooks/useWorkoutStats'
import { METRIC_SHORT_LABELS, type Metric } from '../../lib/stats'
import { ActivityHeatmap } from './ActivityHeatmap'
import { ExerciseProgress, PersonalRecords } from './ExerciseProgress'
import { KpiTiles } from './KpiTiles'
import { MuscleDistribution } from './MuscleDistribution'
import { WeeklyChart } from './WeeklyChart'

const METRICS: Metric[] = ['reps', 'sets', 'volumeKg']

export function StatsDashboard() {
  const { user, profile } = useSession()
  const { logs, ready, week, weekStreak, weeks } = useWorkoutStats(user.uid)
  const isDesktop = useIsDesktop()
  const [metric, setMetric] = useState<Metric>('reps')

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

      <Loadable ready={ready} skeleton={<DashboardSkeleton />}>
        <div className="mt-6 space-y-4 lg:mt-8 lg:space-y-5">
          <KpiTiles week={week} weeklyGoalDays={profile.weeklyGoalDays} weekStreak={weekStreak} />
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            <WeeklyChart weeks={weeks} metric={metric} className="lg:col-span-2" />
            <MuscleDistribution logs={logs} />
          </div>
          {/* A full year on desktop; half a year keeps the cells tappable on phones. */}
          <ActivityHeatmap logs={logs} metric={metric} weeks={isDesktop ? 53 : 26} />
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            <ExerciseProgress logs={logs} className="lg:col-span-2" />
            <PersonalRecords logs={logs} />
          </div>
        </div>
      </Loadable>
    </div>
  )
}

/** Mirrors the dashboard layout (KPI row, chart rows) so nothing jumps when the data arrives. */
function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-4 lg:mt-8 lg:space-y-5" aria-busy aria-label="Statistik wird geladen">
      <div>
        <span className="skeleton mb-2 ml-1 block h-3 w-24 rounded-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="glass rounded-3xl p-4 lg:p-5">
              <span className="skeleton block h-3 w-20 rounded-full" />
              <span className="skeleton mt-3 block h-7 w-16 rounded-lg" />
              <span className="skeleton mt-2.5 block h-4 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <SkeletonCard className="lg:col-span-2" chartHeight="h-64 lg:h-72" bars />
        <SkeletonCard chartHeight="h-64 lg:h-72" />
      </div>
      <SkeletonCard chartHeight="h-36" />
    </div>
  )
}

function SkeletonCard({ className = '', chartHeight, bars }: { className?: string; chartHeight: string; bars?: boolean }) {
  return (
    <div className={`glass rounded-3xl p-4 sm:p-5 ${className}`}>
      <span className="skeleton block h-4 w-40 rounded-md" />
      <span className="skeleton mt-2 block h-3 w-56 max-w-full rounded-md" />
      {bars ? (
        <div className={`mt-5 flex items-end gap-[3%] ${chartHeight}`}>
          {[38, 52, 30, 64, 48, 70, 56, 80, 62, 74, 58, 44].map((height, index) => (
            <span key={index} className="skeleton flex-1 rounded-t-md" style={{ height: `${height}%` }} />
          ))}
        </div>
      ) : (
        <span className={`skeleton mt-5 block rounded-2xl ${chartHeight}`} />
      )}
    </div>
  )
}
