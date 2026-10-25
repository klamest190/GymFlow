import { AnimatePresence, m, useMotionValue, useTransform } from 'framer-motion'
import { Check, Info, Plus, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NumberStepper } from '../../components/ui/NumberStepper'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { haptic, useIsTouch } from '../../hooks/useUi'
import { reveal, settle, snap } from '../../lib/motion'
import { createSet } from '../../lib/workoutMath'
import type { Exercise, WorkoutEntry, WorkoutSet } from '../../types/models'

interface ExerciseEntryCardProps {
  entry: WorkoutEntry
  /** Catalog data for the info panel; missing only if the exercise was removed from the catalog. */
  exercise?: Exercise
  onChange: (entry: WorkoutEntry) => void
  onRemove: () => void
}

const DELETE_THRESHOLD = -110

const weightFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 })

/**
 * One exercise of the day as a set log: logged sets read as stamped numbers ("12 × 5 kg"),
 * and exactly one set is open for editing, by default the last one. Tapping another set opens it.
 */
export function ExerciseEntryCard({ entry, exercise, onChange, onRemove }: ExerciseEntryCardProps) {
  const isTouch = useIsTouch()
  const [showInfo, setShowInfo] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragX = useMotionValue(0)
  const deleteOpacity = useTransform(dragX, [-140, -40, 0], [1, 0.4, 0])
  const deleteScale = useTransform(dragX, [-140, -40], [1, 0.6])

  const activeId = entry.sets.some((set) => set.id === selectedId) ? selectedId : (entry.sets.at(-1)?.id ?? null)

  const updateSet = (setId: string, patch: Partial<WorkoutSet>) =>
    onChange({ ...entry, sets: entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) })

  const addSet = () => {
    const last = entry.sets.at(-1)
    const next = createSet(last?.reps ?? exercise?.defaultReps ?? 10, last?.weightKg ?? null)
    haptic(12)
    setSelectedId(next.id)
    onChange({ ...entry, sets: [...entry.sets, next] })
  }

  const removeSet = (setId: string) => onChange({ ...entry, sets: entry.sets.filter((set) => set.id !== setId) })

  return (
    <div className="relative">
      {/* Revealed behind the card while swiping left on touch devices. */}
      <m.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 flex items-center justify-end rounded-3xl bg-danger-fill pr-7 text-white"
        aria-hidden
      >
        <m.span style={{ scale: deleteScale }}>
          <Trash2 className="size-6" />
        </m.span>
      </m.div>

      <m.article
        style={{ x: dragX }}
        drag={isTouch ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.8, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < DELETE_THRESHOLD) {
            haptic(20)
            onRemove()
          }
        }}
        className="glass relative touch-pan-y rounded-3xl p-4 sm:p-5"
      >
        <header className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="headline truncate text-[25px]">{entry.exerciseName}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[entry.primaryMuscle]}`} />
              {MUSCLE_GROUP_LABELS[entry.primaryMuscle]}
            </p>
          </div>
          {exercise?.instructions && (
            <IconButton label="Ausführung anzeigen" active={showInfo} onClick={() => setShowInfo((value) => !value)}>
              <Info className="size-4.5" />
            </IconButton>
          )}
          <IconButton label="Übung entfernen" onClick={onRemove} danger>
            <Trash2 className="size-4.5" />
          </IconButton>
        </header>

        <AnimatePresence initial={false}>
          {showInfo && exercise && (
            <m.div {...reveal} className="overflow-hidden">
              <div className="mt-3 rounded-xl bg-sunken p-4 text-[14px] leading-relaxed">
                <p className="text-fg/85">{exercise.instructions}</p>
                <ul className="mt-3 space-y-1.5">
                  {exercise.formCues.map((cue) => (
                    <li key={cue} className="flex items-start gap-2 text-[13px] text-muted">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-accent-fg" strokeWidth={3} />
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        <ol className="mt-3">
          <AnimatePresence initial={false}>
            {entry.sets.map((set, index) => (
              <m.li
                key={set.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={settle}
                className="border-t border-line first:border-t-0"
              >
                {set.id === activeId ? (
                  <ActiveSet
                    entry={entry}
                    set={set}
                    number={index + 1}
                    onChange={(patch) => updateSet(set.id, patch)}
                    onRemove={entry.sets.length > 1 ? () => removeSet(set.id) : undefined}
                  />
                ) : (
                  <LoggedSet entry={entry} set={set} number={index + 1} onSelect={() => setSelectedId(set.id)} />
                )}
              </m.li>
            ))}
          </AnimatePresence>
        </ol>

        <m.button
          type="button"
          layout="position"
          transition={settle}
          whileTap={{ scale: 0.97 }}
          onClick={addSet}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-3 text-[14px] font-semibold transition-colors hover:border-fg/40 hover:bg-sunken"
        >
          <Plus className="size-4" strokeWidth={2.75} />
          Satz hinzufügen
        </m.button>
      </m.article>
    </div>
  )
}

/** A logged set as stamped figures; the whole row opens it for editing. */
function LoggedSet({ entry, set, number, onSelect }: { entry: WorkoutEntry; set: WorkoutSet; number: number; onSelect: () => void }) {
  const weight = set.weightKg === null ? '–' : weightFormatter.format(set.weightKg)
  const description = entry.usesWeight
    ? `${set.reps} Wiederholungen, ${set.weightKg === null ? 'kein Gewicht' : `${weight} kg`}`
    : `${set.reps} Wiederholungen`
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Satz ${number} bearbeiten: ${description}`}
      className="-mx-2 flex w-[calc(100%+1rem)] items-baseline gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-sunken"
    >
      <span className="numeral w-6 text-[16px] text-muted">{number}</span>
      <span className="numeral text-[39px] leading-none">
        {set.reps}
        {entry.usesWeight ? (
          <>
            <span className="px-1.5 text-[25px] text-muted">×</span>
            {weight}
            <span className="ml-1 text-[20px] text-muted">kg</span>
          </>
        ) : (
          <span className="ml-1.5 text-[20px] text-muted">Wdh.</span>
        )}
      </span>
    </button>
  )
}

/** The set being logged: big steppers on a knurled grip. */
function ActiveSet({
  entry,
  set,
  number,
  onChange,
  onRemove,
}: {
  entry: WorkoutEntry
  set: WorkoutSet
  number: number
  onChange: (patch: Partial<WorkoutSet>) => void
  onRemove?: () => void
}) {
  const weightLabel = entry.perDumbbell ? 'kg je Hantel' : 'kg'
  return (
    <m.div {...reveal} className="overflow-hidden">
      <div className="knurl my-2 rounded-xl border border-line p-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Satz {number}</span>
          {onRemove && (
            <m.button
              type="button"
              whileTap={{ scale: 0.88 }}
              transition={snap}
              onClick={onRemove}
              className="-my-1 grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/15 hover:text-danger"
              aria-label={`Satz ${number} entfernen`}
            >
              <X className="size-4" strokeWidth={2.5} />
            </m.button>
          )}
        </div>
        <div className={`mt-2 grid gap-3 sm:flex sm:gap-12 ${entry.usesWeight ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Field label="Wdh.">
            <NumberStepper
              size="lg"
              label={`Wiederholungen Satz ${number}`}
              value={set.reps}
              step={1}
              min={0}
              max={999}
              onChange={(reps) => onChange({ reps: reps ?? 0 })}
            />
          </Field>
          {entry.usesWeight && (
            <Field label={weightLabel}>
              <NumberStepper
                size="lg"
                label={`${entry.perDumbbell ? 'Gewicht je Hantel' : 'Gewicht'} Satz ${number}`}
                value={set.weightKg}
                step={entry.perDumbbell ? 1 : 2.5}
                min={0}
                max={999}
                nullable
                placeholder="–"
                onChange={(weightKg) => onChange({ weightKg })}
              />
            </Field>
          )}
        </div>
      </div>
    </m.div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="block text-[12px] font-medium text-muted">{label}</span>
      <div className="mt-1 flex">{children}</div>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  active,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-9 shrink-0 place-items-center rounded-xl transition active:scale-90 ${
        active
          ? 'bg-fg text-bg'
          : danger
            ? 'text-muted hover:bg-danger/15 hover:text-danger'
            : 'text-muted hover:bg-sunken hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}
