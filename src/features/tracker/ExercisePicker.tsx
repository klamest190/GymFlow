import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { haptic } from '../../hooks/useUi'
import type { Exercise, MuscleGroup } from '../../types/models'

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

  const availableMuscles = useMemo(
    () => [...new Set(exercises.map((exercise) => exercise.primaryMuscle))],
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
      title="Übung hinzufügen"
      subtitle={`${exercises.length} Übungen im Katalog`}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98]"
        >
          Fertig
        </button>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 bg-surface-solid/95 px-5 pb-3 backdrop-blur-xl lg:-mx-7 lg:px-7">
        <label className="flex items-center gap-2.5 rounded-2xl bg-sunken px-3.5 py-3">
          <Search className="size-4.5 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Übung suchen"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted"
            type="search"
            enterKeyHint="search"
          />
        </label>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 lg:-mx-7 lg:px-7">
          <button type="button" className={chip(muscle === 'all')} onClick={() => setMuscle('all')}>
            Alle
          </button>
          {availableMuscles.map((group) => (
            <button key={group} type="button" className={chip(muscle === group)} onClick={() => setMuscle(group)}>
              {MUSCLE_GROUP_LABELS[group]}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-1 space-y-1">
        {filtered.map((exercise) => {
          const added = addedIds.has(exercise.id)
          const expanded = expandedId === exercise.id
          return (
            <li key={exercise.id} className="rounded-2xl transition-colors hover:bg-sunken/60">
              <div className="flex items-center gap-3 px-2 py-2.5">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : exercise.id)}
                  aria-expanded={expanded}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${MUSCLE_GROUP_TINTS[exercise.primaryMuscle]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold tracking-tight">{exercise.name}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
                    </span>
                  </span>
                  <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <motion.button
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
                  aria-label={added ? `${exercise.name} bereits hinzugefügt` : `${exercise.name} hinzufügen`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={String(added)}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                    >
                      {added ? <Check className="size-4.5" strokeWidth={3} /> : <Plus className="size-4.5" strokeWidth={2.75} />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 pb-3 pl-[30px] text-[14px] leading-relaxed text-muted">
                      <p className="text-fg/85">{exercise.description}</p>
                      {exercise.instructions && <p className="mt-2">{exercise.instructions}</p>}
                      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wider">
                        Standard: {exercise.defaultSets} × {exercise.defaultReps}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li className="py-12 text-center text-[15px] text-muted">Keine Übung gefunden.</li>
        )}
      </ul>
    </Sheet>
  )
}
