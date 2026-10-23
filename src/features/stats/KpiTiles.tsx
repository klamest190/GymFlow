import { motion, type Variants } from 'framer-motion'
import { Dumbbell, Flame, Layers, Minus, Repeat, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import type { Trend, WeekComparison } from '../../hooks/useWorkoutStats'
import { formatWeekday, todayKey } from '../../lib/dates'
import { formatMetric, type Metric } from '../../lib/stats'
import { useChartTheme } from './chartTheme'

interface KpiTilesProps {
  week: WeekComparison
  weeklyGoalDays: number
  weekStreak: number
}

const METRIC_TILES: {
  metric: Metric
  label: string
  icon: LucideIcon
  unit?: string
}[] = [
  { metric: 'reps', label: 'Wiederholungen', icon: Repeat },
  { metric: 'sets', label: 'Sätze', icon: Layers },
  { metric: 'volumeKg', label: 'Volumen', icon: Dumbbell, unit: 'kg' },
]

const tileMotion: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 360,
      damping: 30,
      delay: index * 0.05,
    },
  }),
}

export function KpiTiles({ week, weeklyGoalDays, weekStreak }: KpiTilesProps) {
  const today = todayKey()
  const weekday = formatWeekday(today)
  // "Mo–Mi": the comparison window, shown in the badge tooltip.
  const comparisonWindow = weekday === 'Mo' ? 'Mo' : `Mo–${weekday}`
  return (
    <section aria-label="Diese Woche">
      <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Diese Woche</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <motion.div variants={tileMotion} initial="hidden" animate="shown" custom={0}>
          <GoalTile days={week.thisWeek.days} goal={weeklyGoalDays} weekStreak={weekStreak} />
        </motion.div>
        {METRIC_TILES.map((tile, index) => (
          <motion.div key={tile.metric} variants={tileMotion} initial="hidden" animate="shown" custom={index + 1}>
            <MetricTile {...tile} trend={week.trends[tile.metric]} comparisonWindow={comparisonWindow} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/** Activity-ring style progress towards the weekly training-day goal, plus the week streak. */
function GoalTile({ days, goal, weekStreak }: { days: number; goal: number; weekStreak: number }) {
  const theme = useChartTheme()
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, days / goal)
  const reached = days >= goal
  return (
    <div className="glass flex h-full flex-col justify-center rounded-3xl p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 64 64" className="size-14 shrink-0 -rotate-90 lg:size-16" aria-hidden>
          {/* Meter: the unfilled track is a lighter step of the same ramp. */}
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="8" stroke={theme.accentSoft} opacity={0.6} />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={theme.accent}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          />
        </svg>
        <div className="min-w-0">
          <div className="text-[26px] font-bold leading-none tracking-tight lg:text-[30px]">
            {days}
            <span className="text-[17px] font-semibold text-muted"> / {goal}</span>
          </div>
          <div className="mt-1 text-[12px] font-medium leading-tight text-muted">{reached ? 'Wochenziel erreicht' : 'Trainingstage'}</div>
        </div>
      </div>
      {/* Own full-width row: next to the ring it would wrap word by word on phones. */}
      {weekStreak > 0 && (
        <div className="mt-2.5 flex items-center gap-1 whitespace-nowrap text-[12px] font-semibold text-accent-fg">
          <Flame className="size-3.5 shrink-0" strokeWidth={2.5} />
          {weekStreak} {weekStreak === 1 ? 'Woche' : 'Wochen'} in Folge
        </div>
      )}
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  metric,
  unit,
  trend,
  comparisonWindow,
}: {
  icon: LucideIcon
  label: string
  metric: Metric
  unit?: string
  trend: Trend
  comparisonWindow: string
}) {
  return (
    <div className="glass flex h-full min-w-0 flex-col rounded-3xl p-4 lg:p-5">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
        <Icon className="size-3.5 shrink-0" strokeWidth={2.5} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <AnimatedNumber value={trend.current} compact className="text-[26px] font-bold leading-none tracking-tight lg:text-[30px]" />
        {unit && <span className="text-[14px] font-semibold text-muted">{unit}</span>}
      </div>
      <div className="mt-2 flex min-h-5.5 flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] font-medium">
        <TrendBadge change={trend.change} title={`Vorwoche (${comparisonWindow}): ${formatMetric(trend.previous, metric)}`} />
        {trend.change !== null && <span className="text-muted">vs. Vorwoche</span>}
      </div>
    </div>
  )
}

/** Signed change vs. last week as a tinted pill; the arrow keeps the direction readable without color. */
function TrendBadge({ change, title }: { change: number | null; title: string }) {
  if (change === null) {
    return (
      <span title={title} className="text-muted">
        Vorwoche: –
      </span>
    )
  }
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const tone = change > 0 ? 'bg-accent/25 text-accent-fg' : change < 0 ? 'bg-danger/12 text-danger' : 'bg-sunken text-muted'
  return (
    <motion.span
      title={title}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.25 }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums ${tone}`}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {change > 0 ? '+' : ''}
      {change} %
    </motion.span>
  )
}
