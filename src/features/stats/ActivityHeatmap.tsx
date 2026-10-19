import { useLayoutEffect, useRef, useState } from 'react'
import { formatWeekdayDate, fromDateKey, todayKey } from '../../lib/dates'
import { formatMetric, heatmapGrid, METRIC_LABELS, type HeatmapDay, type Metric } from '../../lib/stats'
import type { WorkoutLog } from '../../types/models'
import { ChartCard } from './ChartCard'
import { useChartTheme } from './chartTheme'

interface ActivityHeatmapProps {
  logs: WorkoutLog[]
  metric: Metric
  weeks: number
}

const WEEKDAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']
const monthFormatter = new Intl.DateTimeFormat('de-DE', { month: 'short' })

/**
 * GitHub-style calendar: one column per week, one cell per day, intensity = quartile of the
 * selected metric. Hover/tap shows the day's value in the readout line below.
 */
export function ActivityHeatmap({ logs, metric, weeks }: ActivityHeatmapProps) {
  const theme = useChartTheme()
  const today = todayKey()
  const grid = heatmapGrid(logs, today, weeks, metric)
  const [focused, setFocused] = useState<HeatmapDay | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const trainingDays = grid.flat().filter((day) => day.level > 0).length

  // On narrow screens the grid scrolls horizontally; start at the most recent weeks.
  useLayoutEffect(() => {
    const element = scroller.current
    if (element) element.scrollLeft = element.scrollWidth
  }, [weeks])

  const startsMonth = (week: HeatmapDay[]) => week.find((day) => fromDateKey(day.date).getDate() === 1)
  const monthName = (date: string) => monthFormatter.format(fromDateKey(date)).replace('.', '')
  const monthLabel = (week: HeatmapDay[], index: number) => {
    const firstOfMonth = startsMonth(week)
    if (firstOfMonth) return monthName(firstOfMonth.date)
    // Label the first column with its month, unless the next month starts right after (labels would overlap).
    const nextMonthSoon = grid.slice(1, 3).some(startsMonth)
    return index === 0 && !nextMonthSoon ? monthName(week[0].date) : ''
  }

  return (
    <ChartCard
      title="Aktivität"
      subtitle={`${trainingDays} Trainingstage in den letzten ${Math.round(weeks / 4.35)} Monaten · Farbe nach ${METRIC_LABELS[metric]}`}
    >
      <div ref={scroller} className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
        <div className="flex min-w-max gap-2 lg:min-w-0">
          <div className="grid shrink-0 grid-rows-[16px_repeat(7,1fr)] gap-0.75 pr-1 text-[10px] font-medium text-muted">
            <span />
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} className="flex items-center leading-none">
                {label}
              </span>
            ))}
          </div>
          <div
            className="grid flex-1 gap-0.75"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(12px, 1fr))` }}
            onPointerLeave={() => setFocused(null)}
          >
            {grid.map((week, weekIndex) => (
              <div key={week[0].date} className="grid grid-rows-[16px_repeat(7,auto)] gap-0.75">
                {/* Absolutely positioned so a label never widens its week column. */}
                <span className="relative">
                  <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] font-medium capitalize leading-4 text-muted">
                    {monthLabel(week, weekIndex)}
                  </span>
                </span>
                {week.map((day) => {
                  const isFuture = day.date > today
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={isFuture}
                      onPointerEnter={() => !isFuture && setFocused(day)}
                      onFocus={() => setFocused(day)}
                      onClick={() => setFocused(day)}
                      aria-label={`${formatWeekdayDate(day.date)}: ${day.level > 0 ? formatMetric(day.value, metric) : 'kein Training'}`}
                      className={`aspect-square w-full rounded-[3px] transition-transform hover:scale-125 focus-visible:scale-125 disabled:invisible ${
                        focused?.date === day.date ? 'ring-2 ring-fg/60' : ''
                      }`}
                      style={{ backgroundColor: theme.heat[day.level] }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted">
        <span className="min-h-4 font-medium" aria-live="polite">
          {focused ? (
            <>
              <span className="text-fg">{formatWeekdayDate(focused.date)}</span>
              {' · '}
              {focused.level > 0 ? formatMetric(focused.value, metric) : 'kein Training'}
            </>
          ) : (
            'Tag antippen oder überfahren für Details'
          )}
        </span>
        <span className="flex items-center gap-1.5">
          Weniger
          {theme.heat.map((color, level) => (
            <span key={level} className="size-3 rounded-[3px]" style={{ backgroundColor: color }} />
          ))}
          Mehr
        </span>
      </div>
    </ChartCard>
  )
}
