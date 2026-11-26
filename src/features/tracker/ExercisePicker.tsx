import { AnimatePresence, m } from 'framer-motion'
import { Check, ChevronDown, Lock, Plus, Search } from 'lucide-react'
import { Suspense, useMemo, useState } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import { useT } from '../../i18n'
import { haptic } from '../../hooks/useUi'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types/models'
import { FigureThumb } from '../exercises/animation/FigureThumb'
import { LazyExerciseAnimation } from '../exercises/animation/lazyFigures'
import { InstructionSteps } from '../exercises/InstructionSteps'
import { useGuestGate } from '../guest/guestGate'

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  /** Exercise IDs already on the selected day. */
  addedIds: Set<string>
  onAdd: (exercise: Exercise) => void
}

export function ExercisePicker({ open, onClose, exercises, addedIds, onAdd }: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // The row under the mouse demonstrates its exercise in the thumbnail.
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const gate = useGuestGate()
  const t = useT()

  // In body order like the catalog filter, independent of the order of the exercises.
  const availableMuscles = useMemo(
    () => MUSCLE_GROUPS.filter((group) => exercises.some((exercise) => exercise.primaryMuscle === group)),
    [exercises],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return exercises.filter(
      (exercise) =>
        (muscle === 'all' || exercise.primaryMuscle === muscle || exercise.secondaryMuscles.includes(muscle)) &&
        (!term || exercise.searchTerms.some((searchTerm) => searchTerm.includes(term))),
    )
  }, [exercises, muscle, search])

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      active ? 'bg-fg text-bg' : 'bg-sunken text-muted hover:text-fg'
    }`

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t.tracker.addExercise}
      subtitle={t.tracker.catalogCount(exercises.length)}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98]"
        >
          {t.common.done}
        </button>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 bg-surface-solid/95 px-5 pb-3 backdrop-blur-xl lg:-mx-7 lg:px-7">
        <label className="flex items-center gap-2.5 rounded-xl bg-sunken px-3.5 py-3">
          <Search className="size-4.5 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.tracker.searchExercise}
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted"
            type="search"
            enterKeyHint="search"
          />
        </label>
        <div className="no-scrollbar scroll-row mt-3 [--row-inset:--spacing(5)] lg:[--row-inset:--spacing(7)]">
          <button type="button" className={chip(muscle === 'all')} onClick={() => setMuscle('all')}>
            {t.tracker.allMuscles}
          </button>
          {availableMuscles.map((group) => (
            <button key={group} type="button" className={chip(muscle === group)} onClick={() => setMuscle(group)}>
              {t.catalog.muscles[group]}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-1 space-y-1">
        {filtered.map((exercise) => {
          const added = addedIds.has(exercise.id)
          const expanded = expandedId === exercise.id
          // Guest mode: the row explains the lock instead of opening or adding.
          const locked = gate.isLocked(exercise.id)
          const showLock = () => gate.showUpgrade({ kind: 'exercise', exercise })
          if (locked) {
            return (
              <li key={exercise.id} className="rounded-2xl transition-colors hover:bg-sunken/60">
                <button type="button" onClick={showLock} className="flex w-full items-center gap-3 px-2 py-2 text-left">
                  <FigureThumb exerciseId={exercise.id} dimmed />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold tracking-tight text-fg/60">{exercise.name}</span>
                    <span className="block truncate text-[13px] text-muted">{t.tracker.withAccount}</span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-muted" aria-label={t.tracker.isLocked(exercise.name)}>
                    <Lock className="size-4" strokeWidth={2.5} />
                  </span>
                </button>
              </li>
            )
          }
          return (
            <li
              key={exercise.id}
              className="rounded-2xl transition-colors hover:bg-sunken/60"
              onPointerEnter={(event) => event.pointerType === 'mouse' && setHoveredId(exercise.id)}
              onPointerLeave={() => setHoveredId((id) => (id === exercise.id ? null : id))}
            >
              <div className="flex items-center gap-3 px-2 py-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : exercise.id)}
                  aria-expanded={expanded}
                >
                  {/* Expanded, the large figure below takes over the demonstration. */}
                  <FigureThumb exerciseId={exercise.id} playing={hoveredId === exercise.id && !expanded} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold tracking-tight">{exercise.name}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {t.catalog.muscles[exercise.primaryMuscle]}, {t.catalog.equipment[exercise.equipment]}
                    </span>
                  </span>
                  <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <m.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  disabled={added}
                  onClick={() => {
                    haptic(14)
                    onAdd(exercise)
                  }}
                  className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
                    added ? 'bg-accent text-accent-ink' : 'bg-sunken text-fg hover:bg-accent hover:text-accent-ink'
                  }`}
                  aria-label={added ? t.tracker.alreadyAddedExercise(exercise.name) : t.tracker.addNamed(exercise.name)}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <m.span
                      key={String(added)}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                    >
                      {added ? <Check className="size-4.5" strokeWidth={3} /> : <Plus className="size-4.5" strokeWidth={2.75} />}
                    </m.span>
                  </AnimatePresence>
                </m.button>
              </div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 px-2 pb-3 text-[14px] leading-relaxed text-muted sm:flex-row sm:gap-4">
                      <span className="relative mx-auto aspect-square w-full max-w-56 shrink-0 overflow-hidden rounded-2xl bg-sunken sm:mx-0 sm:size-40">
                        <Suspense fallback={null}>
                          <LazyExerciseAnimation exerciseId={exercise.id} label={t.tracker.demonstration(exercise.name)} />
                        </Suspense>
                      </span>
                      <div className="min-w-0">
                        <p className="text-fg/85">{exercise.description}</p>
                        {exercise.instructions && <InstructionSteps instructions={exercise.instructions} className="mt-3" />}
                        <p className="mt-2 text-[13px] font-medium">
                          {t.tracker.recommended(exercise.defaultSets, exercise.defaultReps)}
                        </p>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="py-12 text-center text-[15px] text-muted">{t.tracker.noExerciseFound}</li>
        )}
      </ul>
    </Sheet>
  )
}
