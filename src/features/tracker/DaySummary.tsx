import { motion } from 'framer-motion'
import { Flame, Layers, Repeat } from 'lucide-react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { computeMuscleGroupReps, computeTotals } from '../../lib/workoutMath'
import type { MuscleGroup, WorkoutEntry } from '../../types/models'

/** Day totals with spring-animated counters and a segmented muscle distribution bar. */
export function DaySummary({ entries }: { entries: WorkoutEntry[] }) {
  const totals = computeTotals(entries)
  const muscles = (Object.entries(computeMuscleGroupReps(entries)) as [MuscleGroup, number][])
    .filter(([, reps]) => reps > 0)
    .sort((a, b) => b[1] - a[1])
  const muscleTotal = muscles.reduce((sum, [, reps]) => sum + reps, 0)

  const stats = [
    { label: 'Sätze', value: totals.sets, icon: Layers },
    { label: 'Wdh.', value: totals.reps, icon: Repeat },
    { label: 'kg Volumen', value: totals.volumeKg, icon: Flame },
  ]

  return (
    <section className="glass rounded-3xl p-4 sm:p-5" aria-label="Tagesübersicht">
      <h2 className="hidden text-[13px] font-semibold uppercase tracking-[0.08em] text-muted lg:block">Tagesübersicht</h2>
      <div className="grid grid-cols-3 gap-2 lg:mt-4 lg:gap-3">
        {stats.map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            className={`min-w-0 rounded-2xl p-3 lg:p-3.5 ${index === 0 ? 'bg-accent text-accent-ink shadow-accent' : 'bg-sunken'}`}
          >
            <Icon className={`size-4 ${index === 0 ? 'text-accent-ink/70' : 'text-muted'}`} strokeWidth={2.5} />
            <AnimatedNumber
              value={value}
              compact
              className="mt-2 block text-[26px] font-bold leading-none tracking-tight tabular-nums lg:text-[28px]"
            />
            <span className={`mt-1 block truncate text-[12px] font-medium ${index === 0 ? 'text-accent-ink/70' : 'text-muted'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-sunken">
          {muscles.map(([muscle, reps]) => (
            <motion.div
              key={muscle}
              layout
              className={`h-full rounded-full ${MUSCLE_GROUP_TINTS[muscle]}`}
              initial={{ width: 0 }}
              animate={{ width: `${(reps / muscleTotal) * 100}%` }}
              transition={{ type: 'spring', stiffness: 160, damping: 24 }}
            />
          ))}
        </div>
        {muscles.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {muscles.map(([muscle, reps]) => (
              <li key={muscle} className="flex items-center gap-1.5 text-[13px] text-muted">
                <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[muscle]}`} />
                <span className="font-medium text-fg">{MUSCLE_GROUP_LABELS[muscle]}</span>
                {Math.round((reps / muscleTotal) * 100)}%
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted">Trainierte Muskelgruppen erscheinen hier.</p>
        )}
      </div>
    </section>
  )
}
