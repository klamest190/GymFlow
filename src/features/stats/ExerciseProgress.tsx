import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getExercise } from '../../data/exercises'
import { MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { formatDayMonth, formatDaysAgo, formatWeekdayDate } from '../../lib/dates'
import { formatKg } from '../../lib/exerciseHistory'
import { exerciseProgress, formatCompact, trainedExerciseIds, type ProgressPoint } from '../../lib/stats'
import type { WorkoutLog } from '../../types/models'
import { ChartCard, ChartEmpty, TooltipCard } from './ChartCard'
import { useChartTheme } from './chartTheme'

/** Line of the heaviest set (or total reps for bodyweight exercises) per session. */
export function ExerciseProgress({ logs, className }: { logs: WorkoutLog[]; className?: string }) {
  const theme = useChartTheme()
  const exerciseIds = trainedExerciseIds(logs).filter((id) => getExercise(id))
  const [picked, setPicked] = useState<string | null>(null)
  const selectedId = picked && exerciseIds.includes(picked) ? picked : exerciseIds[0]
  const exercise = selectedId ? getExercise(selectedId) : undefined
  const points = selectedId ? exerciseProgress(logs, selectedId) : []
  const byWeight = Boolean(exercise?.usesWeight) && points.some((point) => point.bestWeightKg !== null)
  const valueOf = (point: ProgressPoint) => (byWeight ? (point.bestWeightKg ?? 0) : point.totalReps)
  const data = points.map((point) => ({ ...point, value: valueOf(point) }))

  return (
    <ChartCard
      title="Fortschritt pro Übung"
      subtitle={exercise ? (byWeight ? 'Schwerster Satz pro Training (kg)' : 'Wiederholungen pro Training') : undefined}
      className={className}
    >
      {exerciseIds.length === 0 ? (
        <ChartEmpty>Sobald du trainierst, siehst du hier deinen Verlauf.</ChartEmpty>
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
            {exerciseIds.map((id) => {
              const item = getExercise(id)!
              const active = id === selectedId
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPicked(id)}
                  aria-pressed={active}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    active ? 'bg-fg text-bg' : 'bg-sunken text-muted hover:text-fg'
                  }`}
                >
                  <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[item.primaryMuscle]}`} />
                  {item.name}
                </button>
              )
            })}
          </div>
          <div className="h-56 w-full lg:h-auto lg:min-h-64 lg:flex-1" role="img" aria-label={`Verlauf ${exercise?.name ?? ''}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
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
                  cursor={{ stroke: theme.axis, strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const point = active ? (payload?.[0]?.payload as (ProgressPoint & { value: number }) | undefined) : undefined
                    if (!point) return null
                    return (
                      <TooltipCard title={formatWeekdayDate(point.date)}>
                        <div className="font-semibold text-fg">
                          {byWeight ? formatKg(point.value) : `${point.value} Wdh.`}
                        </div>
                        {byWeight && <div>{point.totalReps} Wdh. gesamt</div>}
                      </TooltipCard>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={theme.accent}
                  strokeWidth={2}
                  fill="url(#progress-fill)"
                  dot={{ r: 4, fill: theme.accent, stroke: theme.surface, strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: theme.accent, stroke: theme.surface, strokeWidth: 2 }}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </ChartCard>
  )
}

/** Best weight (or best single-set reps for bodyweight exercises) per exercise. */
export function PersonalRecords({ logs, className }: { logs: WorkoutLog[]; className?: string }) {
  const records = trainedExerciseIds(logs)
    .map((id) => {
      const exercise = getExercise(id)
      if (!exercise) return null
      let best = 0
      let date = ''
      for (const log of logs) {
        for (const entry of log.entries) {
          if (entry.exerciseId !== id) continue
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
