import { AnimatePresence, motion } from 'framer-motion'
import { Search, SearchX } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { EXERCISES, getExercise } from '../../data/exercises'
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { useLogsInRange } from '../../hooks/useData'
import { useUserId } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { useToast } from '../../components/ui/toastContext'
import { addDays, formatDaysAgo, todayKey } from '../../lib/dates'
import { buildExerciseHistory, type ExerciseSession } from '../../lib/exerciseHistory'
import { buildWorkoutLog, createEntry } from '../../lib/workoutMath'
import { repository } from '../../services/repository'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types/models'
import { ExerciseDetailSheet } from './ExerciseDetailSheet'

/** How far back the catalog looks for "last trained" and history. */
const HISTORY_DAYS = 90
const NO_SESSIONS: ExerciseSession[] = []
/** Only offer filters for muscle groups that at least one exercise trains as primary muscle. */
const USED_MUSCLES = MUSCLE_GROUPS.filter((group) => EXERCISES.some((exercise) => exercise.primaryMuscle === group))

/** Read-only overview of the fixed exercise catalog with per-exercise history. */
export function ExerciseCatalog() {
  const userId = useUserId()
  const today = todayKey()
  const { logs, ready } = useLogsInRange(userId, addDays(today, -(HISTORY_DAYS - 1)), today)

  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const toast = useToast()

  const history = useMemo(() => buildExerciseHistory(logs), [logs])
  const todayLog = logs.find((log) => log.date === today) ?? null
  const todayIds = new Set(todayLog?.entries.map((entry) => entry.exerciseId))
  const selected = selectedId ? (getExercise(selectedId) ?? null) : null

  const term = search.trim().toLowerCase()
  const filtered = EXERCISES.filter(
    (exercise) =>
      (muscle === 'all' || exercise.primaryMuscle === muscle || exercise.secondaryMuscles.includes(muscle)) &&
      (!term || exercise.searchTerms.some((searchTerm) => searchTerm.includes(term))),
  )

  const addToToday = (exercise: Exercise) => {
    if (!ready || todayIds.has(exercise.id)) return
    const entries = todayLog?.entries ?? []
    // Close right away: the write is optimistic (offline cache), so the entry is already in "Heute".
    setSelectedId(null)
    toast({ tone: 'success', title: `${exercise.name} hinzugefügt`, description: 'Du findest die Übung im Tab „Heute“.' })
    repository
      .saveLog(buildWorkoutLog(userId, today, [...entries, createEntry(exercise, entries.length)], todayLog))
      .catch((error) => toast({ tone: 'error', title: 'Nicht gespeichert', description: authErrorMessage(error) }))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{EXERCISES.length} Übungen</p>
        <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">Übungen</h1>
      </header>

      <div className="glass mt-5 space-y-3 rounded-3xl p-3 lg:mt-8 lg:p-4">
        <label className="flex items-center gap-2.5 rounded-2xl bg-sunken px-3.5 py-3">
          <Search className="size-4.5 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Übung suchen"
            type="search"
            enterKeyHint="search"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted"
          />
        </label>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 lg:-mx-4 lg:px-4">
          <FilterChip active={muscle === 'all'} onClick={() => setMuscle('all')}>
            Alle Muskeln
          </FilterChip>
          {USED_MUSCLES.map((group) => (
            <FilterChip key={group} active={muscle === group} onClick={() => setMuscle(group)} tint={MUSCLE_GROUP_TINTS[group]}>
              {MUSCLE_GROUP_LABELS[group]}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                index={index}
                exercise={exercise}
                sessions={history.get(exercise.id) ?? NO_SESSIONS}
                onClick={() => setSelectedId(exercise.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="glass mt-6 flex flex-col items-center rounded-3xl px-6 py-14 text-center">
          <SearchX className="size-8 text-muted" />
          <h2 className="mt-4 text-[18px] font-bold tracking-tight">Keine Übung gefunden</h2>
          <p className="mt-1 text-[15px] text-muted">Versuche einen anderen Suchbegriff oder Muskelfilter.</p>
        </div>
      )}

      <ExerciseDetailSheet
        exercise={selected}
        onClose={() => setSelectedId(null)}
        sessions={selected ? (history.get(selected.id) ?? NO_SESSIONS) : NO_SESSIONS}
        historyDays={HISTORY_DAYS}
        addedToday={selected ? todayIds.has(selected.id) : false}
        onAddToToday={addToToday}
      />
    </div>
  )
}

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
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 8) * 0.035, type: 'spring', stiffness: 380, damping: 32 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
    >
      <button
        type="button"
        onClick={onClick}
        className="glass flex h-full w-full flex-col rounded-3xl p-5 text-left transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
      >
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
      </button>
    </motion.li>
  )
}

function FilterChip({ active, onClick, tint, children }: { active: boolean; onClick: () => void; tint?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active ? 'bg-fg text-bg' : 'bg-sunken text-muted hover:text-fg'
      }`}
    >
      {tint && <span className={`size-2 rounded-full ${tint}`} />}
      {children}
    </button>
  )
}
