import { AnimatePresence, m } from 'framer-motion'
import { RotateCcw, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { FilterPills, type FilterOption } from '../../components/ui/FilterPills'
import { Loadable } from '../../components/ui/Loadable'
import { useToast } from '../../components/ui/toastContext'
import { getExercise } from '../../data/exercises'
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { EXERCISE_HISTORY_DAYS, FILTERABLE_MUSCLES, useExercises, type MuscleFilter } from '../../hooks/useExercises'
import { formatDaysAgo, todayKey } from '../../lib/dates'
import { fade } from '../../lib/motion'
import type { ExerciseSession } from '../../lib/exerciseHistory'
import { nextPlannedSet } from '../../lib/plannedSet'
import { newSetValues } from '../../lib/workoutMath'
import type { DateKey, Exercise } from '../../types/models'
import { openSetDraft } from '../tracker/useSetDraft'
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
  const catalog = useExercises(user.uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const toast = useToast()
  const selected = selectedId ? (getExercise(selectedId) ?? null) : null

  const addToToday = (exercise: Exercise) => {
    if (!catalog.ready || catalog.isAddedToday(exercise.id)) return
    // Close right away: the write is optimistic (offline cache), so the entry is already in "Heute".
    setSelectedId(null)
    toast({ tone: 'success', title: `${exercise.name} hinzugefügt`, description: 'Du findest die Übung im Tab „Heute“.' })
    const { entry, saved } = catalog.addToToday(exercise)
    // Set 1 waits open in "Heute", prefilled like there (the catalog's history covers the last 90 days).
    const previous = catalog.sessionsOf(exercise.id).find((session) => session.date < todayKey())?.entry ?? null
    openSetDraft(entry.id, nextPlannedSet(entry, previous, newSetValues(exercise, profile.dumbbellKg)))
    saved.catch((error) => toast({ tone: 'error', title: 'Nicht gespeichert', description: authErrorMessage(error) }))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="headline text-[39px] lg:text-[49px]">Übungen</h1>
        <p className="mt-2 text-[15px] text-muted">
          {catalog.isFiltered ? `${catalog.exercises.length} von ${catalog.totalCount}` : catalog.totalCount} Übungen im Katalog
        </p>
      </header>

      <div className="glass mt-5 space-y-3 rounded-3xl p-3 lg:mt-8 lg:p-4">
        <label className="flex items-center gap-2.5 rounded-xl bg-sunken px-3.5 py-3 transition-shadow focus-within:ring-2 focus-within:ring-fg/40">
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
            <m.ul key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  sessions={catalog.sessionsOf(exercise.id)}
                  onClick={() => setSelectedId(exercise.id)}
                />
              ))}
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

/** "heute", "gestern", "vor 3 Tagen", "12. Okt.": reads after "Zuletzt". */
const lastLabel = (date: DateKey) => {
  const label = formatDaysAgo(date)
  return label === 'Heute' || label === 'Gestern' ? label.toLowerCase() : label
}

/**
 * Catalog card. No layout animation and no hover lift: cards stay where they are, and the figure
 * demonstrating the movement on hover/focus is the only thing that moves.
 */
function ExerciseCard({ exercise, sessions, onClick }: { exercise: Exercise; sessions: ExerciseSession[]; onClick: () => void }) {
  const last = sessions[0]
  // The figure stands still in the list (calm) and only demonstrates the movement on hover/focus.
  const [active, setActive] = useState(false)
  return (
    <m.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>
      <button
        type="button"
        onClick={onClick}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="glass flex h-full w-full flex-col rounded-3xl p-5 text-left transition-colors duration-150 hover:border-fg/25 active:bg-sunken"
      >
        <div className="flex w-full gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[exercise.primaryMuscle]}`} />
                {MUSCLE_GROUP_LABELS[exercise.primaryMuscle]}
              </span>
              <span className="rounded-md bg-sunken px-2 py-0.5 text-[12px] font-medium text-muted">
                {DIFFICULTY_LABELS[exercise.difficulty]}
              </span>
            </div>
            <h3 className="headline mt-2.5 text-[25px]">{exercise.name}</h3>
            <p className="mt-1.5 line-clamp-2 min-h-[2lh] text-[14px] leading-snug text-muted">{exercise.description}</p>
          </div>
          {exercise.id in EXERCISE_ANIMATIONS && (
            <span className="relative size-22 shrink-0 self-center overflow-hidden rounded-xl bg-sunken">
              <ExerciseAnimation exerciseId={exercise.id} playing={active} compact label={`Ausführung: ${exercise.name}`} />
            </span>
          )}
        </div>
        <div className="mt-4 flex w-full items-baseline justify-between gap-2 border-t border-line pt-3 text-[13px]">
          <span className="flex items-baseline gap-2">
            <span className="numeral text-[17px]">
              {exercise.defaultSets} × {exercise.defaultReps}
            </span>
            <span className="text-muted">{EQUIPMENT_LABELS[exercise.equipment]}</span>
          </span>
          {last ? (
            <span className="font-medium">Zuletzt {lastLabel(last.date)}</span>
          ) : (
            <span className="text-muted">Noch nicht trainiert</span>
          )}
        </div>
      </button>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      className="glass mt-6 flex flex-col items-center rounded-3xl px-6 py-14 text-center"
    >
      <h2 className="headline text-[31px]">Keine Übung gefunden</h2>
      <p className="mt-1 max-w-xs text-[15px] text-muted">
        {hasSearch ? 'Versuche einen anderen Suchbegriff oder eine andere Muskelgruppe.' : 'Für diese Muskelgruppe gibt es keine Übung.'}
      </p>
      <m.button
        type="button"
        onClick={onReset}
        whileTap={{ scale: 0.96 }}
        className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink"
      >
        <RotateCcw className="size-4" strokeWidth={2.5} />
        Filter zurücksetzen
      </m.button>
    </m.div>
  )
}
