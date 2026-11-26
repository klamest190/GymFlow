import { AnimatePresence, m } from 'framer-motion'
import { Lock, RotateCcw, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { FilterPills, type FilterOption } from '../../components/ui/FilterPills'
import { Loadable } from '../../components/ui/Loadable'
import { useToast } from '../../components/ui/toastContext'
import { getExercise } from '../../data/exercises'
import { GUEST_EXERCISE_IDS } from '../../data/guest'
import { MUSCLE_GROUP_TINTS, REGION_TINTS } from '../../data/muscleGroups'
import { useT, type Messages } from '../../i18n'
import { EXERCISE_HISTORY_DAYS, FILTERABLE_MUSCLES, useExercises, type MuscleFilter } from '../../hooks/useExercises'
import { groupByRegion } from '../../lib/catalogSections'
import { daysBetween, formatDaysAgo, todayKey } from '../../lib/dates'
import { fade } from '../../lib/motion'
import type { ExerciseSession } from '../../lib/exerciseHistory'
import { nextPlannedSet } from '../../lib/plannedSet'
import { newSetValues } from '../../lib/workoutMath'
import type { DateKey, Exercise } from '../../types/models'
import { useGuestGate } from '../guest/guestGate'
import { openSetDraft } from '../tracker/useSetDraft'
import { ExerciseAnimation } from './animation/ExerciseAnimation'
import { EXERCISE_ANIMATIONS } from './animation/poses'
import { DifficultyMeter } from './DifficultyMeter'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'

const muscleOptions = (t: Messages): FilterOption<MuscleFilter>[] => [
  { value: 'all', label: t.exercises.allMuscles },
  ...FILTERABLE_MUSCLES.map((group) => ({ value: group, label: t.catalog.muscles[group], dot: MUSCLE_GROUP_TINTS[group] })),
]
const SKELETON_CARDS = 6
/** A gallery: two figures side by side on phones, up to four on wide screens. */
const GRID = 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4'

/** Read-only overview of the fixed exercise catalog with per-exercise history. */
export function ExerciseCatalog() {
  const { user, profile } = useSession()
  const catalog = useExercises(user.uid)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const toast = useToast()
  const gate = useGuestGate()
  const t = useT()
  const selected = selectedId ? (getExercise(selectedId) ?? null) : null
  // A language switch brings a new catalog array, so the sections also rename their muscles.
  const sections = useMemo(() => groupByRegion(catalog.exercises), [catalog.exercises])

  const addToToday = (exercise: Exercise) => {
    if (!catalog.ready || catalog.isAddedToday(exercise.id)) return
    // Close right away: the write is optimistic (offline cache), so the entry is already in "Heute".
    setSelectedId(null)
    toast({ tone: 'success', title: t.exercises.added(exercise.name), description: t.exercises.addedText })
    const { entry, saved } = catalog.addToToday(exercise)
    // Set 1 waits open in "Heute", prefilled like there (the catalog's history covers the last 90 days).
    const previous = catalog.sessionsOf(exercise.id).find((session) => session.date < todayKey())?.entry ?? null
    openSetDraft(entry.id, nextPlannedSet(entry, previous, newSetValues(exercise, profile.dumbbellKg)))
    saved.catch((error) => toast({ tone: 'error', title: t.exercises.notSaved, description: authErrorMessage(error) }))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="headline text-[39px] lg:text-[49px]">{t.exercises.title}</h1>
        <p className="mt-2 text-[15px] text-muted">
          {t.exercises.count(catalog.exercises.length, catalog.totalCount, catalog.isFiltered)}
          {gate.isGuest && t.exercises.guestCount(GUEST_EXERCISE_IDS.size)}
        </p>
      </header>

      <div className="glass mt-5 space-y-3 rounded-3xl p-3 lg:mt-8 lg:p-4">
        <label className="flex items-center gap-2.5 rounded-xl bg-sunken px-3.5 py-3 transition-shadow focus-within:ring-2 focus-within:ring-fg/40">
          <Search className="size-4.5 shrink-0 text-muted" />
          <input
            value={catalog.search}
            onChange={(event) => catalog.setSearch(event.target.value)}
            placeholder={t.exercises.search}
            type="search"
            enterKeyHint="search"
            aria-label={t.exercises.search}
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
          />
          <AnimatePresence>
            {catalog.search && (
              <m.button
                type="button"
                aria-label={t.exercises.clearSearch}
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
          label={t.exercises.filterByMuscle}
          value={catalog.muscle}
          onChange={catalog.setMuscle}
          options={muscleOptions(t)}
          className="[--row-inset:--spacing(3)] lg:[--row-inset:--spacing(4)]"
        />
      </div>

      <Loadable
        ready={catalog.ready}
        skeleton={
          <ul aria-label={t.exercises.loading} className={`mt-8 ${GRID}`}>
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <ExerciseCardSkeleton key={index} />
            ))}
          </ul>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {catalog.exercises.length > 0 ? (
            <m.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} className="mt-8 space-y-9">
              {sections.map((section) => (
                <section key={section.region} aria-labelledby={`region-${section.region}`}>
                  <header className="flex items-baseline gap-3 px-1">
                    <span className={`size-2.5 shrink-0 self-center rounded-full ${REGION_TINTS[section.region]}`} aria-hidden />
                    <h2 id={`region-${section.region}`} className="headline text-[31px]">
                      {t.catalog.regions[section.region]}
                    </h2>
                    <p className="min-w-0 truncate text-[14px] text-muted">{section.muscles}</p>
                  </header>
                  <ul className={`mt-3 ${GRID}`}>
                    {section.exercises.map((exercise) => {
                      const locked = gate.isLocked(exercise.id)
                      return (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          sessions={catalog.sessionsOf(exercise.id)}
                          locked={locked}
                          onClick={() => (locked ? gate.showUpgrade({ kind: 'exercise', exercise }) : setSelectedId(exercise.id))}
                        />
                      )
                    })}
                  </ul>
                </section>
              ))}
            </m.div>
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

/** "Zuletzt gestern", "Zuletzt vor 3 Tagen", "Zuletzt 12. Okt." */
const lastLabel = (date: DateKey, texts: Messages['exercises']) => {
  const label = formatDaysAgo(date)
  return texts.lastDone(label, daysBetween(date, todayKey()) <= 1)
}

/**
 * Catalog card: the figure is the picture of the exercise, so it takes the card's top half; the
 * description waits in the detail sheet. No layout animation and no hover lift: the figure
 * demonstrating the movement on hover/focus is the only thing that moves. A locked card (guest
 * mode) keeps its figure still behind a lock and opens the upgrade sheet.
 */
function ExerciseCard({
  exercise,
  sessions,
  locked,
  onClick,
}: {
  exercise: Exercise
  sessions: ExerciseSession[]
  locked: boolean
  onClick: () => void
}) {
  const last = sessions[0]
  const [hovered, setHovered] = useState(false)
  const t = useT()
  const active = hovered && !locked
  return (
    <m.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>
      <button
        type="button"
        onClick={onClick}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={locked ? t.exercises.lockedInGuestMode(exercise.name) : undefined}
        className="glass flex h-full w-full flex-col rounded-3xl p-2 text-left transition-colors duration-150 hover:border-fg/25 active:bg-sunken"
      >
        <span className="relative block aspect-[5/4] w-full overflow-hidden rounded-2xl bg-sunken">
          {exercise.id in EXERCISE_ANIMATIONS && (
            <span className={`block size-full ${locked ? 'opacity-30' : ''}`}>
              <ExerciseAnimation exerciseId={exercise.id} playing={active} compact label={t.tracker.demonstration(exercise.name)} />
            </span>
          )}
          {locked ? (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-10 place-items-center rounded-full bg-fg text-bg shadow-soft">
                <Lock className="size-4.5" strokeWidth={2.5} />
              </span>
            </span>
          ) : (
            last && (
              <span className="absolute left-2 top-2 rounded-full bg-surface-solid/90 px-2.5 py-1 text-[12px] font-semibold">
                {lastLabel(last.date, t.exercises)}
              </span>
            )
          )}
        </span>
        <span className="flex flex-1 flex-col px-2 pb-2 pt-3">
          <h3 className={`headline text-[19px] leading-[1.1] sm:text-[22px] ${locked ? 'text-fg/60' : ''}`}>{exercise.name}</h3>
          <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">
            {t.catalog.muscles[exercise.primaryMuscle]}, {t.catalog.equipment[exercise.equipment]}
          </span>
          <span className="mt-auto pt-3">
            <DifficultyMeter difficulty={exercise.difficulty} />
          </span>
        </span>
      </button>
    </m.li>
  )
}

/** Same footprint as ExerciseCard, so nothing jumps when the data arrives. */
function ExerciseCardSkeleton() {
  return (
    <li className="glass flex flex-col rounded-3xl p-2" aria-hidden>
      <span className="skeleton aspect-[5/4] w-full rounded-2xl" />
      <span className="flex flex-col px-2 pb-2 pt-3">
        <span className="skeleton h-4.5 w-4/5 rounded-lg" />
        <span className="skeleton mt-2.5 h-3 w-3/5 rounded-md" />
        <span className="skeleton mt-4 h-3.5 w-24 rounded-md" />
      </span>
    </li>
  )
}

function EmptyState({ hasSearch, onReset }: { hasSearch: boolean; onReset: () => void }) {
  const t = useT()
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      className="glass mt-6 flex flex-col items-center rounded-3xl px-6 py-14 text-center"
    >
      <h2 className="headline text-[31px]">{t.exercises.noneFound}</h2>
      <p className="mt-1 max-w-xs text-[15px] text-muted">
        {hasSearch ? t.exercises.tryOtherSearch : t.exercises.noneForMuscle}
      </p>
      <m.button
        type="button"
        onClick={onReset}
        whileTap={{ scale: 0.96 }}
        className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink"
      >
        <RotateCcw className="size-4" strokeWidth={2.5} />
        {t.exercises.resetFilters}
      </m.button>
    </m.div>
  )
}
