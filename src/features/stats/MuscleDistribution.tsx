import { m } from 'framer-motion'
import { useState } from 'react'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { addDays, todayKey } from '../../lib/dates'
import { muscleDistribution } from '../../lib/stats'
import type { WorkoutLog } from '../../types/models'
import { ChartCard, ChartEmpty } from './ChartCard'
import { useChartTheme } from './chartTheme'

type Range = '7' | '30' | '90'
type Scope = 'primary' | 'all'

const decimal = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

/**
 * Sets per muscle group as sorted horizontal bars. Up to twelve groups is too many for a
 * categorical palette, so all bars share the accent and identity comes from the labels.
 */
export function MuscleDistribution({ logs, className }: { logs: WorkoutLog[]; className?: string }) {
  const theme = useChartTheme()
  const [range, setRange] = useState<Range>('30')
  const [scope, setScope] = useState<Scope>('all')
  const rows = muscleDistribution(logs, addDays(todayKey(), -(Number(range) - 1)), scope === 'all')
  const max = rows[0]?.sets ?? 0

  return (
    <ChartCard
      title="Muskelgruppen"
      subtitle={scope === 'all' ? 'Sätze pro Muskelgruppe · Hilfsmuskeln zählen ½' : 'Sätze pro Muskelgruppe · nur Hauptmuskel'}
      className={className}
      actions={<SegmentedControl label="Zeitraum" size="sm" value={range} onChange={setRange} options={RANGE_OPTIONS} />}
    >
      {rows.length === 0 ? (
        <ChartEmpty>Keine Trainings in den letzten {range} Tagen.</ChartEmpty>
      ) : (
        <ul className="flex-1 space-y-2.5">
          {rows.map((row, index) => (
            <li key={row.muscle} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 text-[13px]">
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                <span className={`size-2 shrink-0 rounded-full ${MUSCLE_GROUP_TINTS[row.muscle]}`} />
                <span className="truncate">{MUSCLE_GROUP_LABELS[row.muscle]}</span>
              </span>
              <span className="h-2.5 overflow-hidden rounded-full bg-sunken">
                <m.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: theme.accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.sets / max) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20, delay: index * 0.03 }}
                />
              </span>
              <span className="w-[76px] text-right tabular-nums text-muted">
                <span className="font-semibold text-fg">{decimal.format(row.sets)}</span> · {Math.round(row.share * 100)} %
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <SegmentedControl
          label="Muskeln"
          size="sm"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'primary', label: 'Nur Hauptmuskel' },
            { value: 'all', label: 'Inkl. Hilfsmuskeln' },
          ]}
        />
      </div>
    </ChartCard>
  )
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '7', label: '7 T' },
  { value: '30', label: '30 T' },
  { value: '90', label: '90 T' },
]
