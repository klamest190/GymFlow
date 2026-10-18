import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { Check, Info, Plus, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NumberStepper } from '../../components/ui/NumberStepper'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { haptic, useIsTouch } from '../../hooks/useUi'
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

export function ExerciseEntryCard({ entry, exercise, onChange, onRemove }: ExerciseEntryCardProps) {
  const isTouch = useIsTouch()
  const [showInfo, setShowInfo] = useState(false)
  const dragX = useMotionValue(0)
  const deleteOpacity = useTransform(dragX, [-140, -40, 0], [1, 0.4, 0])
  const deleteScale = useTransform(dragX, [-140, -40], [1, 0.6])

  const setsLabel = (() => {
    const reps = new Set(entry.sets.map((set) => set.reps))
    return reps.size === 1 ? `${entry.sets.length} × ${entry.sets[0]?.reps ?? 0}` : `${entry.sets.length} Sätze`
  })()

  const updateSet = (setId: string, patch: Partial<WorkoutSet>) =>
    onChange({ ...entry, sets: entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) })

  const addSet = () => {
    const last = entry.sets.at(-1)
    haptic(12)
    onChange({ ...entry, sets: [...entry.sets, createSet(last?.reps ?? exercise?.defaultReps ?? 10, last?.weightKg ?? null)] })
  }

  const removeSet = (setId: string) => onChange({ ...entry, sets: entry.sets.filter((set) => set.id !== setId) })

  return (
    <div className="relative">
      {/* Revealed behind the card while swiping left on touch devices. */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 flex items-center justify-end rounded-3xl bg-danger pr-7 text-white"
        aria-hidden
      >
        <motion.span style={{ scale: deleteScale }}>
          <Trash2 className="size-6" />
        </motion.span>
      </motion.div>

      <motion.article
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
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[entry.primaryMuscle]}`} />
              {MUSCLE_GROUP_LABELS[entry.primaryMuscle]}
            </div>
            <h3 className="mt-1 truncate text-[17px] font-semibold tracking-tight">{entry.exerciseName}</h3>
            <p className="text-[13px] text-muted tabular-nums">{setsLabel}</p>
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
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-2xl bg-sunken p-4 text-[14px] leading-relaxed">
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4">
          <div
            className={`grid items-center gap-x-2 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted ${
              entry.usesWeight ? 'grid-cols-[28px_1fr_1fr_28px]' : 'grid-cols-[28px_1fr_28px]'
            }`}
          >
            <span>Satz</span>
            <span className="text-center">Wdh.</span>
            {entry.usesWeight && <span className="text-center">kg</span>}
            <span />
          </div>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {entry.sets.map((set, index) => (
                <motion.li
                  key={set.id}
                  layout
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  className={`grid items-center gap-x-2 rounded-2xl bg-sunken/60 px-1 py-1.5 ${
                    entry.usesWeight ? 'grid-cols-[28px_1fr_1fr_28px]' : 'grid-cols-[28px_1fr_28px]'
                  }`}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-surface-solid text-[12px] font-bold tabular-nums shadow-sm">
                    {index + 1}
                  </span>
                  <div className="flex justify-center">
                    <NumberStepper
                      label={`Wiederholungen Satz ${index + 1}`}
                      value={set.reps}
                      step={1}
                      min={0}
                      max={999}
                      onChange={(reps) => updateSet(set.id, { reps: reps ?? 0 })}
                    />
                  </div>
                  {entry.usesWeight && (
                    <div className="flex justify-center">
                      <NumberStepper
                        label={`Gewicht Satz ${index + 1}`}
                        value={set.weightKg}
                        step={2.5}
                        min={0}
                        max={999}
                        nullable
                        placeholder="–"
                        onChange={(weightKg) => updateSet(set.id, { weightKg })}
                      />
                    </div>
                  )}
                  {entry.sets.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSet(set.id)}
                      className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-danger/15 hover:text-danger active:scale-90"
                      aria-label={`Satz ${index + 1} entfernen`}
                    >
                      <X className="size-3.5" strokeWidth={2.5} />
                    </button>
                  ) : (
                    <span />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <motion.button
            type="button"
            layout
            whileTap={{ scale: 0.97 }}
            onClick={addSet}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-2.5 text-[14px] font-semibold text-accent-fg transition-colors hover:border-accent hover:bg-accent/10"
          >
            <Plus className="size-4" strokeWidth={2.75} />
            Satz hinzufügen
          </motion.button>
        </div>
      </motion.article>
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
      className={`grid size-9 shrink-0 place-items-center rounded-full transition active:scale-90 ${
        active
          ? 'bg-accent text-accent-ink'
          : danger
            ? 'text-muted hover:bg-danger/15 hover:text-danger'
            : 'text-muted hover:bg-sunken hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}
