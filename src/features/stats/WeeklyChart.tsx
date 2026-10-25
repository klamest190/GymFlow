import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { addDays, formatDayMonth, isoWeek } from '../../lib/dates'
import { formatCompact, formatMetric, METRIC_LABELS, percentChange, type Metric, type WeekPoint } from '../../lib/stats'
import { ChartCard, ChartEmpty, TooltipCard, TooltipRow } from './ChartCard'
import { useChartTheme, type ChartTheme } from './chartTheme'

interface WeeklyChartProps {
  weeks: WeekPoint[]
  metric: Metric
  className?: string
}

type WeekDatum = WeekPoint & { label: string }

const TOOLTIP_METRICS: Metric[] = ['reps', 'sets', 'volumeKg']

/** Columns per ISO week; the still-running current week uses the softer step of the ramp. */
export function WeeklyChart({ weeks, metric, className }: WeeklyChartProps) {
  const theme = useChartTheme()
  const hasData = weeks.some((week) => week[metric] > 0)
  const data: WeekDatum[] = weeks.map((week) => ({ ...week, label: `KW ${isoWeek(week.weekStart)}` }))

  return (
    <ChartCard
      title={`${METRIC_LABELS[metric]} pro Woche`}
      subtitle={`Die letzten ${weeks.length} Wochen. Die laufende Woche ist heller, weil sie noch nicht vorbei ist.`}
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
                animationDuration={180}
                content={(props) => <WeekTooltip {...props} metric={metric} theme={theme} />}
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

/** All three totals of the hovered week; the plotted metric is highlighted and compared with the week before. */
function WeekTooltip({
  active,
  payload,
  metric,
  theme,
}: Pick<TooltipContentProps<number, string>, 'active' | 'payload'> & { metric: Metric; theme: ChartTheme }) {
  const week = active ? (payload?.[0]?.payload as WeekDatum | undefined) : undefined
  if (!week) return null
  const change = percentChange(week[metric], week.previous[metric])
  return (
    <TooltipCard
      title={week.label}
      subtitle={`${formatDayMonth(week.weekStart)}–${formatDayMonth(addDays(week.weekStart, 6))}${week.isCurrent ? ', läuft noch' : ''}`}
    >
      {TOOLTIP_METRICS.map((item) => (
        <TooltipRow
          key={item}
          label={METRIC_LABELS[item].replace(' (kg)', '')}
          value={formatMetric(week[item], item)}
          highlight={item === metric}
          swatch={item === metric ? theme.accent : undefined}
        />
      ))}
      <TooltipRow label="Trainingstage" value={week.days} />
      {change !== null && !week.isCurrent && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-line pt-2 text-[12px]">
          <ChangeIcon change={change} />
          <span>
            <span className={`font-semibold ${change > 0 ? 'text-accent-fg' : change < 0 ? 'text-danger' : 'text-fg'}`}>
              {change > 0 ? '+' : ''}
              {change} %
            </span>{' '}
            vs. Vorwoche
          </span>
        </div>
      )}
    </TooltipCard>
  )
}

function ChangeIcon({ change }: { change: number }) {
  if (change > 0) return <TrendingUp className="size-3.5 text-accent-fg" strokeWidth={2.5} />
  if (change < 0) return <TrendingDown className="size-3.5 text-danger" strokeWidth={2.5} />
  return <Minus className="size-3.5" strokeWidth={2.5} />
}
