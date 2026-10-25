import { AnimatePresence, m } from 'framer-motion'
import { RotateCcw, Search, SearchX, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { FilterPills, type FilterOption } from '../../components/ui/FilterPills'
import { Loadable } from '../../components/ui/Loadable'
import { useToast } from '../../components/ui/toastContext'
import { getExercise } from '../../data/exercises'
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { EXERCISE_HISTORY_DAYS, FILTERABLE_MUSCLES, useExercises, type MuscleFilter } from '../../hooks/useExercises'
import { formatDaysAgo } from '../../lib/dates'
import type { ExerciseSession } from '../../lib/exerciseHistory'
import type { Exercise } from '../../types/models'
import { ExerciseAnimation } from './animation/ExerciseAnimation'
import { EXERCISE_ANIMATIONS } from './animation/poses'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'

const MUSCLE_OPTIONS: FilterOption<MuscleFilter>[] = [
  { value: 'all', label: 'Alle Muskeln' },
  ...FILTERABLE_MUSCLES.map((group) => ({ value: group, label: MUSCLE_GROUP_LABELS[group], dot: MUSCLE_GROUP_TINTS[group] })),
]
const SKELETON_CARDS = 6

/** Read-only overview of the fixed exercise catalog with per-exercise history. */
export function ExerciseCatalog() {
  const { user, profile } = useSession()
  const catalog = useExercises(user.uid, profile.dumbbellKg)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const toast = useToast()
  const selected = selectedId ? (getExercise(selectedId) ?? null) : null

  const addToToday = (exercise: Exercise) => {
    if (!catalog.ready || catalog.isAddedToday(exercise.id)) return
    // Close right away: the write is optimistic (offline cache), so the entry is already in "Heute".
    setSelectedId(null)
    toast({ tone: 'success', title: `${exercise.name} hinzugefügt`, description: 'Du findest die Übung im Tab „Heute“.' })
    catalog.addToToday(exercise).catch((error) => toast({ tone: 'error', title: 'Nicht gespeichert', description: authErrorMessage(error) }))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
          {catalog.isFiltered ? `${catalog.exercises.length} von ${catalog.totalCount}` : catalog.totalCount} Übungen
        </p>
        <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">Übungen</h1>
      </header>

      <div className="glass mt-5 space-y-3 rounded-3xl p-3 lg:mt-8 lg:p-4">
        <label className="flex items-center gap-2.5 rounded-2xl bg-sunken px-3.5 py-3 transition-shadow focus-within:ring-2 focus-within:ring-accent">
          <Search className="size-4.5 shrink-0 text-muted" />
          <input
            value={catalog.search}
            onChange={(event) => catalog.setSearch(event.target.value)}
            placeholder="Übung suchen"
            type="search"
            enterKeyHint="search"
            aria-label="Übung suchen"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />
          <AnimatePresence>
            {catalog.search && (
              <m.button
                type="button"
                aria-label="Suche leeren"
                onClick={() => catalog.setSearch('')}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="grid size-5 shrink-0 place-items-center rounded-full bg-muted/40 text-bg"
              >
                <X className="size-3" strokeWidth={3} />
              </m.button>
            )}
          </AnimatePresence>
        </label>
        <FilterPills
          label="Nach Muskelgruppe filtern"
          value={catalog.muscle}
          onChange={catalog.setMuscle}
          options={MUSCLE_OPTIONS}
          className="-mx-3 px-3 lg:-mx-4 lg:px-4"
        />
      </div>

      <Loadable
        ready={catalog.ready}
        skeleton={
          <ul aria-label="Übungen werden geladen" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <ExerciseCardSkeleton key={index} />
            ))}
          </ul>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {catalog.exercises.length > 0 ? (
            <m.ul key="list" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {catalog.exercises.map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.id}
                    index={index}
                    exercise={exercise}
                    sessions={catalog.sessionsOf(exercise.id)}
                    onClick={() => setSelectedId(exercise.id)}
                  />
                ))}
              </AnimatePresence>
            </m.ul>
          ) : (
            <EmptyState key="empty" hasSearch={catalog.search.trim() !== ''} onReset={catalog.resetFilters} />
          )}
        </AnimatePresence>
      </Loadable>

      <ExerciseDetailSheet
        exercise={selected}
        onClose={() => setSelectedId(null)}
        sessions={selected ? catalog.sessionsOf(selected.id) : []}
        historyDays={EXERCISE_HISTORY_DAYS}
        addedToday={selected ? catalog.isAddedToday(selected.id) : false}
        onAddToToday={addToToday}
      />
    </div>
  )
}

const cardMotion = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2 },
  tap: { scale: 0.98, y: 0 },
}
/** The bigger hover shadow fades in on its own layer: animating opacity is smoother than box-shadow. */
const shadowMotion = { rest: { opacity: 0 }, hover: { opacity: 1 }, tap: { opacity: 0.4 } }
const spring = { type: 'spring', stiffness: 400, damping: 28 } as const

function ExerciseCard({
  exercise,
  sessions,
  index,
  onClick,
}: {
  exercise: Exercise
  sessions: ExerciseSession[]
  index: number
  onClick: () => void
}) {
  const last = sessions[0]
  // The figure stands still in the list (calm) and only demonstrates the movement on hover/focus.
  const [active, setActive] = useState(false)
  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.04, ...spring } }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={spring}
    >
      <m.button
        type="button"
        onClick={onClick}
        onHoverStart={() => setActive(true)}
        onHoverEnd={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        variants={cardMotion}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileTap="tap"
        transition={spring}
        className="glass relative flex h-full w-full flex-col rounded-3xl p-5 text-left"
      >
        <m.span
          aria-hidden
          variants={shadowMotion}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute inset-0 rounded-3xl shadow-float"
        />
        <div className="flex w-full gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[exercise.primaryMuscle]}`} />
                {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]}
              </span>
              <span className="rounded-full bg-sunken px-2.5 py-1 text-[11px] font-semibold text-muted">
                {DIFFICULTY_LABELS[exercise.difficulty]}
              </span>
            </div>
            <h3 className="mt-2 text-[18px] font-semibold leading-snug tracking-tight">{exercise.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-[2lh] text-[14px] leading-snug text-muted">{exercise.description}</p>
          </div>
          {exercise.id in EXERCISE_ANIMATIONS && (
            <span className="relative size-22 shrink-0 self-center overflow-hidden rounded-2xl bg-sunken">
              <ExerciseAnimation exerciseId={exercise.id} playing={active} compact label={`Ausführung: ${exercise.name}`} />
            </span>
          )}
        </div>
        <div className="mt-4 flex w-full items-center justify-between gap-2 border-t border-line pt-3 text-[13px]">
          <span className="font-semibold tabular-nums">
            {exercise.defaultSets} × {exercise.defaultReps}
            <span className="font-normal text-muted"> · {EQUIPMENT_LABELS[exercise.equipment]}</span>
          </span>
          {last ? (
            <span className="flex items-center gap-1.5 font-medium text-accent-fg">
              <span className="size-1.5 rounded-full bg-accent-fg" />
              {formatDaysAgo(last.date)}
            </span>
          ) : (
            <span className="text-muted">Noch nicht trainiert</span>
          )}
        </div>
      </m.button>
    </m.li>
  )
}

/** Same footprint as ExerciseCard, so nothing jumps when the data arrives. */
function ExerciseCardSkeleton() {
  return (
    <li className="glass flex flex-col rounded-3xl p-5" aria-hidden>
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between">
            <span className="skeleton h-3 w-20 rounded-full" />
            <span className="skeleton h-5.5 w-16 rounded-full" />
          </div>
          <span className="skeleton mt-3.5 h-4.5 w-3/5 rounded-lg" />
          <span className="skeleton mt-3 h-3.5 w-full rounded-md" />
          <span className="skeleton mt-2 h-3.5 w-4/5 rounded-md" />
        </div>
        <span className="skeleton size-22 shrink-0 rounded-2xl" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-3.5">
        <span className="skeleton h-3.5 w-28 rounded-md" />
        <span className="skeleton h-3.5 w-16 rounded-md" />
      </div>
    </li>
  )
}

function EmptyState({ hasSearch, onReset }: { hasSearch: boolean; onReset: () => void }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={spring}
      className="glass mt-6 flex flex-col items-center rounded-3xl px-6 py-14 text-center"
    >
      <m.span
        initial={{ scale: 0.6, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.05 }}
        className="grid size-16 place-items-center rounded-full bg-sunken"
      >
        <SearchX className="size-7 text-muted" />
      </m.span>
      <h2 className="mt-4 text-[18px] font-bold tracking-tight">Keine Übung gefunden</h2>
      <p className="mt-1 max-w-xs text-[15px] text-muted">
        {hasSearch ? 'Versuche einen anderen Suchbegriff oder eine andere Muskelgruppe.' : 'Für diese Muskelgruppe gibt es keine Übung.'}
      </p>
      <m.button
        type="button"
        onClick={onReset}
        whileTap={{ scale: 0.96 }}
        className="mt-5 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink shadow-accent"
      >
        <RotateCcw className="size-4" strokeWidth={2.5} />
        Filter zurücksetzen
      </m.button>
    </m.div>
  )
}
