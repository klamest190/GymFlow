import { Check, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import { MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { formatDaysAgo } from '../../lib/dates'
import { useT } from '../../i18n'
import { bestReps, bestWeight, formatKg, summarizeSets, type ExerciseSession } from '../../lib/exerciseHistory'
import type { Exercise } from '../../types/models'
import { AnimationStage } from './AnimationStage'
import { InstructionSteps } from './InstructionSteps'

interface ExerciseDetailSheetProps {
  exercise: Exercise | null
  onClose: () => void
  sessions: ExerciseSession[]
  historyDays: number
  addedToday: boolean
  onAddToToday: (exercise: Exercise) => void
}

export function ExerciseDetailSheet({ exercise, onClose, sessions, historyDays, addedToday, onAddToToday }: ExerciseDetailSheetProps) {
  // Keep the last exercise around while the sheet animates out.
  const [shown, setShown] = useState(exercise)
  const t = useT()
  if (exercise && exercise !== shown) setShown(exercise)
  if (!shown) return null

  const best = bestWeight(sessions)
  const bestSet = bestReps(sessions)
  const meta = [
    t.catalog.muscles[shown.primaryMuscle],
    t.catalog.equipment[shown.equipment],
    t.catalog.categories[shown.category],
    t.catalog.difficulty[shown.difficulty],
  ]

  return (
    <Sheet
      open={exercise !== null}
      onClose={onClose}
      title={shown.name}
      subtitle={meta.join(', ')}
      footer={
        <button
          type="button"
          disabled={addedToday}
          onClick={() => onAddToToday(shown)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {addedToday ? <Check className="size-4.5" strokeWidth={3} /> : <Plus className="size-4.5" strokeWidth={3} />}
          {addedToday ? t.exercises.addedToday : t.exercises.addToToday}
        </button>
      }
    >
      <div className="space-y-6 pb-2">
        <AnimationStage key={shown.id} exercise={shown} />

        <Section title={t.exercises.muscleGroups}>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-semibold">
              <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[shown.primaryMuscle]}`} />
              {t.catalog.muscles[shown.primaryMuscle]}
              <span className="font-medium text-muted">{t.exercises.primary}</span>
            </span>
            {shown.secondaryMuscles.map((muscle) => (
              <span key={muscle} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-medium text-muted">
                <span className={`size-2 rounded-full opacity-60 ${MUSCLE_GROUP_TINTS[muscle]}`} />
                {t.catalog.muscles[muscle]}
              </span>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={`${shown.defaultSets} × ${shown.defaultReps}`} label={t.exercises.recommended} />
          <Stat value={String(sessions.length)} label={t.exercises.timesInDays(historyDays)} />
          {shown.usesWeight ? (
            <Stat value={best !== null ? formatKg(best) : '–'} label={t.exercises.bestPerDumbbell} />
          ) : (
            <Stat value={bestSet !== null ? t.common.repsValue(bestSet) : '–'} label={t.exercises.bestSet} />
          )}
        </div>

        <Section title={t.exercises.execution}>
          <p className="text-[15px] font-medium leading-relaxed">{shown.description}</p>
          <InstructionSteps instructions={shown.instructions} className="mt-3 text-[15px] leading-relaxed text-fg/85" />
        </Section>

        <Section title={t.exercises.formCues}>
          <ul className="space-y-2">
            {shown.formCues.map((cue) => (
              <li key={cue} className="flex items-start gap-2.5 text-[15px]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                  <Check className="size-3" strokeWidth={3.5} />
                </span>
                {cue}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.exercises.breathing}>
          <p className="text-[15px] font-medium leading-relaxed">{shown.breathing}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg/80">{t.catalog.breathingRule}</p>
        </Section>

        <Section title={t.exercises.history}>
          {sessions.length === 0 ? (
            <p className="text-[15px] text-muted">{t.exercises.notTrainedInDays(historyDays)}</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken">
              {sessions.slice(0, 6).map(({ date, entry }) => (
                <li key={`${date}-${entry.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-[15px]">
                  <span className="font-medium">{formatDaysAgo(date)}</span>
                  <span className="text-muted tabular-nums">{summarizeSets(entry)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </Sheet>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-sunken p-3">
      <div className="numeral truncate text-[25px] leading-none">{value}</div>
      <div className="mt-0.5 truncate text-[12px] font-medium text-muted">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-[13px] font-semibold text-muted">{title}</h3>
      {children}
    </section>
  )
}
