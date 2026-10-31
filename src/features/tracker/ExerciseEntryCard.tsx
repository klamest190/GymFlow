import { AnimatePresence, m, useMotionValue, useTransform } from 'framer-motion'
import { Check, ChevronUp, History, Info, Plus, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NumberStepper } from '../../components/ui/NumberStepper'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { haptic, useIsTouch } from '../../hooks/useUi'
import { formatLastTime } from '../../lib/exerciseHistory'
import { fade, reveal, settle, snap } from '../../lib/motion'
import { nextPlannedSet } from '../../lib/plannedSet'
import { createSet } from '../../lib/workoutMath'
import { useSetDraft } from './useSetDraft'
import type { Exercise, WorkoutEntry, WorkoutSet } from '../../types/models'

type SetValues = Pick<WorkoutSet, 'reps' | 'weightKg'>

interface ExerciseEntryCardProps {
  entry: WorkoutEntry
  /** Catalog data for the info panel; missing only if the exercise was removed from the catalog. */
  exercise?: Exercise
  /** The exercise's latest session before this day: shown as "Letztes Mal" and repeated set by set. */
  previous: WorkoutEntry | null
  /** First set of an exercise never done before. */
  fallback: SetValues
  onChange: (entry: WorkoutEntry) => void
  onRemove: () => void
  /** After a set was logged, with its number (the tracker starts the rest timer). */
  onSetLogged: (setNumber: number) => void
}

const DELETE_THRESHOLD = -110

const weightFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 })

/**
 * One exercise of the day as a set log. Logged sets read as stamped numbers ("12 × 5 kg"); below
 * them "Satz hinzufügen" opens the next set, prefilled with last time's values, and "Satz abhaken"
 * logs it. The open set is only a draft, so only sets actually done are stored.
 */
export function ExerciseEntryCard({ entry, exercise, previous, fallback, onChange, onRemove, onSetLogged }: ExerciseEntryCardProps) {
  const isTouch = useIsTouch()
  const [showInfo, setShowInfo] = useState(false)
  // A logged set open for correcting, and the next set being entered (kept outside the card, so it
  // survives a tab switch during the rest). Both can be open at once.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useSetDraft(entry.id)
  // A logged set whose row asks "Satz n löschen?" before it is deleted.
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const dragX = useMotionValue(0)
  const deleteOpacity = useTransform(dragX, [-140, -40, 0], [1, 0.4, 0])
  const deleteScale = useTransform(dragX, [-140, -40], [1, 0.6])

  const nextNumber = entry.sets.length + 1

  const updateSet = (setId: string, patch: Partial<WorkoutSet>) =>
    onChange({ ...entry, sets: entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) })

  const askToDelete = (setId: string) => {
    haptic()
    setSelectedId(null)
    setConfirmingId(setId)
  }

  const removeSet = (setId: string) => {
    haptic(20)
    setConfirmingId(null)
    onChange({ ...entry, sets: entry.sets.filter((set) => set.id !== setId) })
  }

  const logSet = (values: SetValues) => {
    haptic(12)
    setDraft(null)
    setSelectedId(null)
    onChange({ ...entry, sets: [...entry.sets, createSet(values.reps, entry.usesWeight ? values.weightKg : null)] })
    onSetLogged(nextNumber)
  }

  const remove = () => {
    setDraft(null)
    onRemove()
  }

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
            remove()
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
            {previous && (
              <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-fg/80">
                <History className="size-3.5 text-muted" strokeWidth={2.5} />
                Letztes Mal: {formatLastTime(previous)}
              </p>
            )}
          </div>
          {exercise?.instructions && (
            <IconButton label="Ausführung anzeigen" active={showInfo} onClick={() => setShowInfo((value) => !value)}>
              <Info className="size-4.5" />
            </IconButton>
          )}
          <IconButton label="Übung entfernen" onClick={remove} danger>
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
                {set.id === confirmingId ? (
                  <ConfirmDelete number={index + 1} onCancel={() => setConfirmingId(null)} onConfirm={() => removeSet(set.id)} />
                ) : set.id === selectedId ? (
                  <EditSet
                    entry={entry}
                    values={set}
                    number={index + 1}
                    onChange={(patch) => updateSet(set.id, patch)}
                    onCollapse={() => setSelectedId(null)}
                    action={<DeleteButton number={index + 1} onClick={() => askToDelete(set.id)} />}
                    // Same button as for a new set, so every open set ends the same way; here it only closes.
                    footer={<LogButton number={index + 1} onClick={() => setSelectedId(null)} />}
                  />
                ) : (
                  <LoggedSet
                    entry={entry}
                    set={set}
                    number={index + 1}
                    onSelect={() => {
                      setConfirmingId(null)
                      setSelectedId(set.id)
                    }}
                    onDelete={() => askToDelete(set.id)}
                  />
                )}
              </m.li>
            ))}
            <m.li key="next" layout="position" transition={settle} className="border-t border-line first:border-t-0">
              {draft ? (
                <EditSet
                  entry={entry}
                  values={draft}
                  number={nextNumber}
                  onChange={(patch) => setDraft({ ...draft, ...patch })}
                  action={
                    <SmallButton label={`Satz ${nextNumber} verwerfen`} onClick={() => setDraft(null)}>
                      <X className="size-4" strokeWidth={2.5} />
                    </SmallButton>
                  }
                  footer={<LogButton number={nextNumber} onClick={() => logSet(draft)} />}
                />
              ) : (
                <AddSetButton
                  onClick={() => {
                    setSelectedId(null)
                    setDraft(nextPlannedSet(entry, previous, fallback))
                  }}
                />
              )}
            </m.li>
          </AnimatePresence>
        </ol>
      </m.article>
    </div>
  )
}

/** "12 × 5 kg", "12 Wdh." */
function SetFigures({ entry, values }: { entry: WorkoutEntry; values: SetValues }) {
  const weight = values.weightKg === null ? '–' : weightFormatter.format(values.weightKg)
  return (
    <span className="numeral text-[39px] leading-none">
      {values.reps}
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
  )
}

const describeSet = (entry: WorkoutEntry, values: SetValues) =>
  entry.usesWeight
    ? `${values.reps} Wiederholungen, ${values.weightKg === null ? 'kein Gewicht' : `${weightFormatter.format(values.weightKg)} kg`}`
    : `${values.reps} Wiederholungen`

/** A logged set as stamped figures: the row opens it for correcting, the bin asks to delete it. */
function LoggedSet({
  entry,
  set,
  number,
  onSelect,
  onDelete,
}: {
  entry: WorkoutEntry
  set: WorkoutSet
  number: number
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div className="-mx-2 flex items-center gap-1">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Satz ${number} bearbeiten: ${describeSet(entry, set)}`}
        className="flex min-w-0 flex-1 items-baseline gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-sunken"
      >
        <span className="numeral w-6 text-[16px] text-muted">{number}</span>
        <SetFigures entry={entry} values={set} />
      </button>
      <DeleteButton number={number} onClick={onDelete} />
    </div>
  )
}

function DeleteButton({ number, onClick }: { number: number; onClick: () => void }) {
  return (
    <SmallButton label={`Satz ${number} löschen`} onClick={onClick} danger>
      <Trash2 className="size-4" />
    </SmallButton>
  )
}

/** Takes the place of a logged set's row until the deletion is confirmed or cancelled. */
function ConfirmDelete({ number, onCancel, onConfirm }: { number: number; onCancel: () => void; onConfirm: () => void }) {
  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade} role="alertdialog" aria-label={`Satz ${number} löschen?`} className="flex items-center gap-2 py-2">
      <p className="min-w-0 flex-1 text-[15px] font-semibold">Satz {number} löschen?</p>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl bg-sunken px-4 py-2.5 text-[14px] font-semibold transition hover:bg-fg hover:text-bg"
      >
        Abbrechen
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-xl bg-danger-fill px-4 py-2.5 text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        Löschen
      </button>
    </m.div>
  )
}

/** Opens the next set for logging. */
function AddSetButton({ onClick }: { onClick: () => void }) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={snap}
      onClick={onClick}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-3.5 text-[15px] font-semibold transition-colors hover:border-fg/40 hover:bg-sunken"
    >
      <Plus className="size-4.5" strokeWidth={2.75} />
      Satz hinzufügen
    </m.button>
  )
}

/** Big steppers on a knurled grip, for the next set or a logged set being corrected. */
function EditSet({
  entry,
  values,
  number,
  onChange,
  onCollapse,
  action,
  footer,
}: {
  entry: WorkoutEntry
  values: SetValues
  number: number
  onChange: (patch: Partial<SetValues>) => void
  /** A logged set: its title row closes the editor again (changes are already saved). */
  onCollapse?: () => void
  action: ReactNode
  footer: ReactNode
}) {
  const weightLabel = entry.perDumbbell ? 'kg je Hantel' : 'kg'
  return (
    <m.div {...reveal} className="overflow-hidden">
      <div className="knurl my-2 rounded-xl border border-line p-3">
        <div className="flex items-center justify-between gap-2">
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              aria-label={`Satz ${number} zuklappen`}
              aria-expanded
              className="-m-1.5 flex min-w-0 flex-1 items-center gap-1.5 rounded-lg p-1.5 text-left text-[13px] font-semibold transition-colors hover:bg-sunken"
            >
              Satz {number}
              <ChevronUp className="size-4 text-muted" strokeWidth={2.5} />
            </button>
          ) : (
            <span className="text-[13px] font-semibold">Satz {number}</span>
          )}
          {action}
        </div>
        <div className={`mt-2 grid gap-3 sm:flex sm:gap-12 ${entry.usesWeight ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Field label="Wdh.">
            <NumberStepper
              size="lg"
              label={`Wiederholungen Satz ${number}`}
              value={values.reps}
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
                value={values.weightKg}
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
        {footer}
      </div>
    </m.div>
  )
}

/**
 * Ends an open set: logs the next set, or closes a corrected one. Graphite, not yellow: every
 * card has one, and a screen gets one yellow surface.
 */
function LogButton({ number, onClick }: { number: number; onClick: () => void }) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={snap}
      onClick={onClick}
      aria-label={`Satz ${number} abhaken`}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-fg py-3.5 text-[15px] font-semibold text-bg transition hover:bg-fg/85"
    >
      <Check className="size-4.5" strokeWidth={3} />
      Satz abhaken
    </m.button>
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

function SmallButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.88 }}
      transition={snap}
      onClick={onClick}
      className={`-my-1 grid size-8 place-items-center rounded-lg text-muted transition-colors ${
        danger ? 'hover:bg-danger/15 hover:text-danger' : 'hover:bg-sunken hover:text-fg'
      }`}
      aria-label={label}
    >
      {children}
    </m.button>
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
