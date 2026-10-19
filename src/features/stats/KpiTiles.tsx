import { motion } from 'framer-motion'
import { Flame, Minus, Repeat, TrendingDown, TrendingUp, Weight, type LucideIcon } from 'lucide-react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { percentChange, type PeriodSummary } from '../../lib/stats'
import { useChartTheme } from './chartTheme'

interface KpiTilesProps {
  thisWeek: PeriodSummary
  /** Same weekdays of last week, so a half-finished week is compared fairly. */
  lastWeekToDate: PeriodSummary
  weeklyGoalDays: number
  weekStreak: number
}

export function KpiTiles({ thisWeek, lastWeekToDate, weeklyGoalDays, weekStreak }: KpiTilesProps) {
  return (
    <section aria-label="Diese Woche">
      <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Diese Woche</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <GoalTile days={thisWeek.days} goal={weeklyGoalDays} />
        <MetricTile
          icon={Repeat}
          label="Wiederholungen"
          value={thisWeek.reps}
          change={percentChange(thisWeek.reps, lastWeekToDate.reps)}
        />
        <MetricTile
          icon={Weight}
          label="Volumen"
          value={thisWeek.volumeKg}
          unit="kg"
          change={percentChange(thisWeek.volumeKg, lastWeekToDate.volumeKg)}
        />
        <MetricTile
          icon={Flame}
          label="Serie"
          value={weekStreak}
          unit={weekStreak === 1 ? 'Woche' : 'Wochen'}
          note="in Folge aktiv"
        />
      </div>
    </section>
  )
}

/** Activity-ring style progress towards the weekly training-day goal. */
function GoalTile({ days, goal }: { days: number; goal: number }) {
  const theme = useChartTheme()
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, days / goal)
  const reached = days >= goal
  return (
    <div className="glass flex items-center gap-3 rounded-3xl p-4 lg:p-5">
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
        <div className="mt-1 text-[12px] font-medium leading-tight text-muted">
          {reached ? 'Wochenziel erreicht' : 'Trainingstage'}
        </div>
      </div>
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  unit,
  change,
  note,
}: {
  icon: LucideIcon
  label: string
  value: number
  unit?: string
  change?: number | null
  note?: string
}) {
  return (
    <div className="glass flex min-w-0 flex-col rounded-3xl p-4 lg:p-5">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
        <Icon className="size-3.5 shrink-0" strokeWidth={2.5} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <AnimatedNumber value={value} compact className="text-[26px] font-bold leading-none tracking-tight lg:text-[30px]" />
        {unit && <span className="text-[14px] font-semibold text-muted">{unit}</span>}
      </div>
      <div className="mt-1.5 min-h-4 text-[12px] font-medium">
        {note && <span className="text-muted">{note}</span>}
        {change !== undefined && <ChangeBadge change={change} />}
      </div>
    </div>
  )
}

/** Signed change vs. last week; icon + text so direction never relies on color alone. */
function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-muted">Vorwoche: –</span>
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const tone = change > 0 ? 'text-accent-fg' : change < 0 ? 'text-danger' : 'text-muted'
  return (
    <span className={`inline-flex items-center gap-1 ${tone}`}>
      <Icon className="size-3.5" strokeWidth={2.5} />
      {change > 0 ? '+' : ''}
      {change} % <span className="text-muted">vs. Vorwoche</span>
    </span>
  )
}
