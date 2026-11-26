import { m } from 'framer-motion'
import { useState } from 'react'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { useT, type Messages } from '../../i18n'
import { formatNumber } from '../../i18n/format'
import { addDays, todayKey } from '../../lib/dates'
import { muscleDistribution } from '../../lib/stats'
import type { WorkoutLog } from '../../types/models'
import { ChartCard, ChartEmpty } from './ChartCard'
import { useChartTheme } from './chartTheme'
import { settle } from '../../lib/motion'

type Range = '7' | '30' | '90'
type Scope = 'primary' | 'all'


/**
 * Sets per muscle group as sorted horizontal bars. Up to twelve groups is too many for a
 * categorical palette, so all bars share the accent and identity comes from the labels.
 */
export function MuscleDistribution({ logs, className }: { logs: WorkoutLog[]; className?: string }) {
  const theme = useChartTheme()
  const t = useT()
  const [range, setRange] = useState<Range>('30')
  const [scope, setScope] = useState<Scope>('all')
  const rows = muscleDistribution(logs, addDays(todayKey(), -(Number(range) - 1)), scope === 'all')
  const max = rows[0]?.sets ?? 0

  return (
    <ChartCard
      title={t.stats.muscleGroups}
      subtitle={scope === 'all' ? t.stats.setsHalfSecondary : t.stats.setsPrimaryOnly}
      className={className}
      actions={<SegmentedControl label={t.stats.range} size="sm" value={range} onChange={setRange} options={rangeOptions(t)} />}
    >
      {rows.length === 0 ? (
        <ChartEmpty>{t.stats.noTrainingInDays(range)}</ChartEmpty>
      ) : (
        <ul className="flex-1 space-y-2.5">
          {rows.map((row) => (
            <li key={row.muscle} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 text-[13px]">
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                <span className={`size-2 shrink-0 rounded-full ${MUSCLE_GROUP_TINTS[row.muscle]}`} />
                <span className="truncate">{t.catalog.muscles[row.muscle]}</span>
              </span>
              <span className="h-2.5 overflow-hidden rounded-full bg-sunken">
                <m.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: theme.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.sets / max) * 100}%` }}
                  transition={settle}
                />
              </span>
              <span className="w-[76px] text-right tabular-nums text-muted">
                <span className="font-semibold text-fg">{formatNumber(row.sets, 1)}</span> ({t.common.percent(Math.round(row.share * 100))})
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <SegmentedControl
          label={t.stats.muscles}
          size="sm"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'primary', label: t.stats.primaryOnly },
            { value: 'all', label: t.stats.withSecondary },
          ]}
        />
      </div>
    </ChartCard>
  )
}

const rangeOptions = (t: Messages): { value: Range; label: string }[] => [
  { value: '7', label: t.stats.days('7') },
  { value: '30', label: t.stats.days('30') },
  { value: '90', label: t.stats.days('90') },
]
