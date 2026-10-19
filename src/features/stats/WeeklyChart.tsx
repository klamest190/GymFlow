import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, formatDayMonth, isoWeek } from '../../lib/dates'
import { formatCompact, formatMetric, METRIC_LABELS, type Metric, type WeekPoint } from '../../lib/stats'
import { ChartCard, ChartEmpty, TooltipCard } from './ChartCard'
import { useChartTheme } from './chartTheme'

interface WeeklyChartProps {
  weeks: WeekPoint[]
  metric: Metric
  className?: string
}

/** Columns per ISO week; the still-running current week uses the softer step of the ramp. */
export function WeeklyChart({ weeks, metric, className }: WeeklyChartProps) {
  const theme = useChartTheme()
  const hasData = weeks.some((week) => week[metric] > 0)
  const data = weeks.map((week) => ({ ...week, label: `KW ${isoWeek(week.weekStart)}` }))

  return (
    <ChartCard
      title={`${METRIC_LABELS[metric]} pro Woche`}
      subtitle={`Letzte ${weeks.length} Wochen · aktuelle Woche hell, da noch nicht abgeschlossen`}
      className={className}
    >
      {hasData ? (
        <div className="h-64 w-full lg:h-auto lg:min-h-72 lg:flex-1" role="img" aria-label={`${METRIC_LABELS[metric]} pro Woche`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={theme.grid} strokeWidth={1} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: theme.grid }}
                tick={{ fill: theme.axis, fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickFormatter={(value: number) => formatCompact(value)}
                allowDecimals={false}
                width={48}
              />
              <Tooltip
                cursor={{ fill: theme.cursor, radius: 8 }}
                content={({ active, payload }) => {
                  const week = active ? (payload?.[0]?.payload as (WeekPoint & { label: string }) | undefined) : undefined
                  if (!week) return null
                  return (
                    <TooltipCard title={`${week.label} · ${formatDayMonth(week.weekStart)}–${formatDayMonth(addDays(week.weekStart, 6))}`}>
                      <div className="font-semibold text-fg">{formatMetric(week[metric], metric)}</div>
                      <div>
                        {week.days} {week.days === 1 ? 'Trainingstag' : 'Trainingstage'}
                        {week.isCurrent && ' · läuft noch'}
                      </div>
                    </TooltipCard>
                  )
                }}
              />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={24} animationDuration={700} animationEasing="ease-out">
                {data.map((week) => (
                  <Cell key={week.weekStart} fill={week.isCurrent ? theme.accentSoft : theme.accent} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty>Noch keine Trainings in den letzten {weeks.length} Wochen.</ChartEmpty>
      )}
      {/* Screen-reader table view of the same data. */}
      <table className="sr-only">
        <caption>{METRIC_LABELS[metric]} pro Woche</caption>
        <tbody>
          {data.map((week) => (
            <tr key={week.weekStart}>
              <th scope="row">{week.label}</th>
              <td>{formatMetric(week[metric], metric)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartCard>
  )
}
