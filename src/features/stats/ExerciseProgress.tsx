import { Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Select, type SelectOption } from '../../components/ui/Select'
import { getExercise } from '../../data/exercises'
import { MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { formatDayMonth, formatDaysAgo, formatWeekdayDate } from '../../lib/dates'
import { formatKg } from '../../lib/exerciseHistory'
import { exerciseProgress, formatCompact, percentChange, trainedExercises, type ProgressPoint } from '../../lib/stats'
import type { WorkoutLog } from '../../types/models'
import { ChartCard, ChartEmpty, TooltipCard, TooltipRow } from './ChartCard'
import { useChartTheme } from './chartTheme'

type ProgressDatum = ProgressPoint & { value: number }

/** Line of the heaviest set (or total reps for bodyweight exercises) per session. */
export function ExerciseProgress({ logs, className = '' }: { logs: WorkoutLog[]; className?: string }) {
  const theme = useChartTheme()
  const trained = useMemo(() => trainedExercises(logs).filter(({ exerciseId }) => getExercise(exerciseId)), [logs])
  const [picked, setPicked] = useState<string | null>(null)
  const selectedId = picked && trained.some(({ exerciseId }) => exerciseId === picked) ? picked : trained[0]?.exerciseId
  const exercise = selectedId ? getExercise(selectedId) : undefined
  const points = useMemo(() => (selectedId ? exerciseProgress(logs, selectedId) : []), [logs, selectedId])
  const byWeight = Boolean(exercise?.usesWeight) && points.some((point) => point.bestWeightKg !== null)
  const data: ProgressDatum[] = points.map((point) => ({ ...point, value: byWeight ? (point.bestWeightKg ?? 0) : point.totalReps }))
  const first = data[0]
  const latest = data.at(-1)
  const change = first && latest && data.length > 1 ? percentChange(latest.value, first.value) : null
  const format = (value: number) => (byWeight ? formatKg(value) : `${value} Wdh.`)

  const options: SelectOption<string>[] = trained.map(({ exerciseId, sessions }) => {
    const item = getExercise(exerciseId)!
    return {
      value: exerciseId,
      label: item.name,
      hint: `${sessions} ${sessions === 1 ? 'Training' : 'Trainings'}`,
      leading: <span className={`size-2.5 shrink-0 rounded-full ${MUSCLE_GROUP_TINTS[item.primaryMuscle]}`} />,
    }
  })

  return (
    <ChartCard
      title="Fortschritt pro Übung"
      subtitle={exercise ? (byWeight ? 'Schwerster Satz pro Training' : 'Wiederholungen pro Training') : undefined}
      // Lifts the card above later cards, so the open dropdown isn't covered on phones.
      className={`relative z-10 ${className}`}
      actions={
        selectedId && (
          <Select label="Übung auswählen" value={selectedId} onChange={setPicked} options={options} className="w-full sm:w-60" />
        )
      }
    >
      {!selectedId || !first || !latest ? (
        <ChartEmpty>Sobald du trainierst, siehst du hier deinen Verlauf.</ChartEmpty>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums">{format(latest.value)}</span>
            <span className="text-[13px] text-muted">Letztes Training: {formatDaysAgo(latest.date)}</span>
            {change !== null && change !== 0 && (
              <span
                title={`Erstes Training im Zeitraum: ${format(first.value)}`}
                className={`ml-auto rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums ${
                  change > 0 ? 'bg-accent/25 text-accent-fg' : 'bg-danger/12 text-danger'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change} % seit Start
              </span>
            )}
          </div>
          <div className="h-56 w-full lg:h-auto lg:min-h-60 lg:flex-1" role="img" aria-label={`Verlauf ${exercise?.name ?? ''}`}>
            <ResponsiveContainer width="100%" height="100%">
              {/* Keyed by exercise: switching remounts the chart, so the line draws in again. */}
              <ComposedChart key={selectedId} data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="progress-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.accent} stopOpacity={theme.areaOpacity * 2} />
                    <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDayMonth}
                  tickLine={false}
                  axisLine={{ stroke: theme.grid }}
                  tick={{ fill: theme.axis, fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.axis, fontSize: 11 }}
                  tickFormatter={(value: number) => formatCompact(value)}
                  width={48}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  cursor={{ stroke: theme.axis, strokeWidth: 1, strokeDasharray: '3 3' }}
                  animationDuration={180}
                  content={({ active, payload }) => {
                    const point = active ? (payload?.[0]?.payload as ProgressDatum | undefined) : undefined
                    if (!point) return null
                    return (
                      <TooltipCard title={formatWeekdayDate(point.date)}>
                        <TooltipRow
                          label={byWeight ? 'Schwerster Satz' : 'Wiederholungen'}
                          value={format(point.value)}
                          highlight
                          swatch={theme.accent}
                        />
                        {byWeight && <TooltipRow label="Wdh. gesamt" value={point.totalReps} />}
                      </TooltipCard>
                    )
                  }}
                />
                {/* Fill and line are separate series so the line can draw itself from left to right. */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="none"
                  fill="url(#progress-fill)"
                  tooltipType="none"
                  activeDot={false}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.accent}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  dot={{ r: 4, fill: theme.accent, stroke: theme.surface, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: theme.accent, stroke: theme.surface, strokeWidth: 2 }}
                  animationDuration={1200}
                  animationEasing="ease-in-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </ChartCard>
  )
}

/** Best weight (or best single-set reps for bodyweight exercises) per exercise. */
export function PersonalRecords({ logs, className }: { logs: WorkoutLog[]; className?: string }) {
  const records = trainedExercises(logs)
    .map(({ exerciseId }) => {
      const exercise = getExercise(exerciseId)
      if (!exercise) return null
      let best = 0
      let date = ''
      for (const log of logs) {
        for (const entry of log.entries) {
          if (entry.exerciseId !== exerciseId) continue
          for (const set of entry.sets) {
            const value = exercise.usesWeight ? (set.weightKg ?? 0) : set.reps
            if (value > best || (value === best && log.date > date)) {
              best = value
              date = log.date
            }
          }
        }
      }
      return best > 0 ? { exercise, best, date } : null
    })
    .filter((record) => record !== null)
    .slice(0, 6)

  return (
    <ChartCard title="Bestleistungen" subtitle="Letzte 12 Monate" className={className}>
      {records.length === 0 ? (
        <ChartEmpty>Noch keine Bestleistungen.</ChartEmpty>
      ) : (
        <ul className="divide-y divide-line">
          {records.map(({ exercise, best, date }) => (
            <li key={exercise.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken">
                <Trophy className="size-4 text-accent-fg" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold tracking-tight">{exercise.name}</span>
                <span className="text-[12px] text-muted">{formatDaysAgo(date)}</span>
              </span>
              <span className="text-[15px] font-bold tabular-nums">
                {exercise.usesWeight ? formatKg(best) : `${best} Wdh.`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
