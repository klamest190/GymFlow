import { Check, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_TINTS,
} from '../../data/muscleGroups'
import { formatDaysAgo } from '../../lib/dates'
import { bestWeight, formatKg, summarizeSets, type ExerciseSession } from '../../lib/exerciseHistory'
import type { Exercise } from '../../types/models'

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
  if (exercise && exercise !== shown) setShown(exercise)
  if (!shown) return null

  const best = bestWeight(sessions)
  const meta = [
    MUSCLE_GROUP_LABELS[shown.primaryMuscle],
    EQUIPMENT_LABELS[shown.equipment],
    CATEGORY_LABELS[shown.category],
    DIFFICULTY_LABELS[shown.difficulty],
  ]

  return (
    <Sheet
      open={exercise !== null}
      onClose={onClose}
      title={shown.name}
      subtitle={meta.join(' · ')}
      footer={
        <button
          type="button"
          disabled={addedToday}
          onClick={() => onAddToToday(shown)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {addedToday ? <Check className="size-4.5" strokeWidth={3} /> : <Plus className="size-4.5" strokeWidth={3} />}
          {addedToday ? 'Heute eingetragen' : 'Zu heute hinzufügen'}
        </button>
      }
    >
      <div className="space-y-6 pb-2">
        <Section title="Muskelgruppen">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-semibold">
              <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[shown.primaryMuscle]}`} />
              {MUSCLE_GROUP_LABELS[shown.primaryMuscle]}
              <span className="font-medium text-muted">primär</span>
            </span>
            {shown.secondaryMuscles.map((muscle) => (
              <span key={muscle} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-medium text-muted">
                <span className={`size-2 rounded-full opacity-60 ${MUSCLE_GROUP_TINTS[muscle]}`} />
                {MUSCLE_GROUP_LABELS[muscle]}
              </span>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={`${shown.defaultSets} × ${shown.defaultReps}`} label="Standard" />
          <Stat value={String(sessions.length)} label={`Mal in ${historyDays} T.`} />
          <Stat value={best !== null ? formatKg(best) : '–'} label="Bestwert" />
        </div>

        <Section title="Ausführung">
          <p className="text-[15px] font-medium leading-relaxed">{shown.description}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg/80">{shown.instructions}</p>
        </Section>

        <Section title="Technik-Hinweise">
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

        <Section title="Verlauf">
          {sessions.length === 0 ? (
            <p className="text-[15px] text-muted">In den letzten {historyDays} Tagen noch nicht trainiert.</p>
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
      <div className="truncate text-[20px] font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 truncate text-[12px] font-medium text-muted">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      {children}
    </section>
  )
}
