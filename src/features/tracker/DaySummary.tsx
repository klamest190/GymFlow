import { m } from 'framer-motion'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { BODY_REGIONS, MUSCLE_REGION, REGION_LABELS, REGION_TINTS, type BodyRegion } from '../../data/muscleGroups'
import { settle } from '../../lib/motion'
import { computeMuscleGroupReps, computeTotals } from '../../lib/workoutMath'
import type { MuscleGroup, WorkoutEntry } from '../../types/models'

const xpFormatter = new Intl.NumberFormat('de-DE')

/**
 * Day totals as stamped figures straight on the page, plus the split by body region. For today
 * also the XP the day will earn once it's over (`pendingXP`).
 */
export function DaySummary({ entries, pendingXP = 0 }: { entries: WorkoutEntry[]; pendingXP?: number }) {
  const totals = computeTotals(entries)
  const repsByRegion = { push: 0, pull: 0, core: 0, legs: 0 } satisfies Record<BodyRegion, number>
  for (const [muscle, reps] of Object.entries(computeMuscleGroupReps(entries)) as [MuscleGroup, number][]) {
    repsByRegion[MUSCLE_REGION[muscle]] += reps
  }
  // Fixed region order, so a color never moves to another place in the bar.
  const regions = BODY_REGIONS.filter((region) => repsByRegion[region] > 0)
  const regionTotal = regions.reduce((sum, region) => sum + repsByRegion[region], 0)

  const stats = [
    { label: 'Sätze', value: totals.sets },
    { label: 'Wiederholungen', value: totals.reps },
    { label: 'kg Volumen', value: totals.volumeKg },
  ]

  return (
    <section className="px-1" aria-label="Tagesübersicht">
      <h2 className="hidden text-[14px] font-semibold text-muted lg:mb-3 lg:block">Tagesübersicht</h2>
      <dl className="flex flex-wrap gap-x-7 gap-y-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="mt-1 text-[13px] font-medium text-muted">{label}</dt>
            <dd>
              <AnimatedNumber value={value} compact className="numeral block text-[39px] leading-none" />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-sunken">
          {regions.map((region) => (
            <m.div
              key={region}
              className={`h-full first:rounded-l-full last:rounded-r-full ${REGION_TINTS[region]}`}
              initial={{ width: 0 }}
              animate={{ width: `${(repsByRegion[region] / regionTotal) * 100}%` }}
              transition={settle}
            />
          ))}
        </div>
        {regions.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {regions.map((region) => (
              <li key={region} className="flex items-center gap-1.5 text-[13px] text-muted">
                <span className={`size-2 rounded-full ${REGION_TINTS[region]}`} />
                <span className="font-medium text-fg">{REGION_LABELS[region]}</span>
                {Math.round((repsByRegion[region] / regionTotal) * 100)} %
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2.5 text-[13px] text-muted">Hier siehst du, welche Körperregionen du heute trainiert hast.</p>
        )}
      </div>

      {pendingXP > 0 && (
        <p className="mt-3 text-[13px] text-muted">
          <span className="font-semibold text-accent-fg tabular-nums">+{xpFormatter.format(pendingXP)} XP</span> für heute. Gutgeschrieben
          werden sie morgen, wenn der Trainingstag abgeschlossen ist.
        </p>
      )}
    </section>
  )
}
