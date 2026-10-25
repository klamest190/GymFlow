import { Flame, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import type { Trend, WeekComparison } from '../../hooks/useWorkoutStats'
import { formatWeekday, todayKey } from '../../lib/dates'
import { formatMetric, type Metric } from '../../lib/stats'

interface KpiTilesProps {
  week: WeekComparison
  weeklyGoalDays: number
  weekStreak: number
}

const METRICS: { metric: Metric; label: string; unit?: string }[] = [
  { metric: 'reps', label: 'Wiederholungen' },
  { metric: 'sets', label: 'Sätze' },
  { metric: 'volumeKg', label: 'Volumen', unit: 'kg' },
]

/** This week at a glance: progress towards the training-day goal, then the totals as stamped figures. */
export function KpiTiles({ week, weeklyGoalDays, weekStreak }: KpiTilesProps) {
  const weekday = formatWeekday(todayKey())
  // "Mo–Mi": the comparison window, shown in the badge tooltip.
  const comparisonWindow = weekday === 'Mo' ? 'Mo' : `Mo–${weekday}`
  return (
    <section aria-label="Diese Woche" className="glass rounded-3xl p-4 sm:p-5">
      <h2 className="text-[14px] font-semibold text-muted">Diese Woche</h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-end lg:gap-10">
        <GoalMeter days={week.thisWeek.days} goal={weeklyGoalDays} weekStreak={weekStreak} />
        <div className="grid grid-cols-3 gap-4">
          {METRICS.map((item) => (
            <MetricFigure key={item.metric} {...item} trend={week.trends[item.metric]} comparisonWindow={comparisonWindow} />
          ))}
        </div>
      </div>
    </section>
  )
}

/** One plate per goal day: filled plates are training days this week. */
function GoalMeter({ days, goal, weekStreak }: { days: number; goal: number; weekStreak: number }) {
  const reached = days >= goal
  return (
    <div>
      <p className="flex items-baseline gap-2">
        <span className="numeral text-[61px] leading-[0.85]">{days}</span>
        <span className="numeral text-[25px] text-muted">/ {goal}</span>
        <span className="ml-1 text-[14px] font-medium text-muted">{reached ? 'Wochenziel erreicht' : 'Trainingstage'}</span>
      </p>
      <div className="mt-3 flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(days, goal)} aria-label="Wochenziel">
        {Array.from({ length: goal }, (_, index) => (
          <span
            key={index}
            className={`h-3 flex-1 rounded-[3px] transition-colors duration-300 ${index < days ? 'bg-accent' : 'knurl bg-sunken'}`}
          />
        ))}
      </div>
      {weekStreak > 0 && (
        <p className="mt-2.5 flex items-center gap-1 text-[13px] font-medium">
          <Flame className="size-3.5 shrink-0 text-accent-fg" strokeWidth={2.5} />
          {weekStreak} {weekStreak === 1 ? 'Woche' : 'Wochen'} in Folge
        </p>
      )}
    </div>
  )
}

function MetricFigure({
  label,
  metric,
  unit,
  trend,
  comparisonWindow,
}: {
  label: string
  metric: Metric
  unit?: string
  trend: Trend
  comparisonWindow: string
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-baseline gap-1">
        <AnimatedNumber value={trend.current} compact className="numeral text-[39px] leading-none" />
        {unit && <span className="numeral text-[17px] text-muted">{unit}</span>}
      </p>
      <p className="mt-1 truncate text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1">
        <TrendBadge change={trend.change} title={`Vorwoche (${comparisonWindow}): ${formatMetric(trend.previous, metric)}`} />
      </p>
    </div>
  )
}

/** Signed change vs. last week; the arrow keeps the direction readable without color. */
function TrendBadge({ change, title }: { change: number | null; title: string }) {
  if (change === null) {
    return (
      <span title={title} className="text-[12px] text-muted">
        Vorwoche: –
      </span>
    )
  }
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const tone = change > 0 ? 'text-accent-fg' : change < 0 ? 'text-danger' : 'text-muted'
  return (
    <span title={title} className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${tone}`}>
      <Icon className="size-3.5" strokeWidth={2.5} />
      {change > 0 ? '+' : ''}
      {change} %<span className="sr-only"> zur Vorwoche</span>
    </span>
  )
}
