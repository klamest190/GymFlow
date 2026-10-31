import { useCallback, useMemo, useState } from 'react'
import { EXERCISES } from '../data/exercises'
import { addDays, todayKey } from '../lib/dates'
import { buildExerciseHistory, type ExerciseSession } from '../lib/exerciseHistory'
import { buildWorkoutLog, createEntry } from '../lib/workoutMath'
import { repository } from '../services/repository'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../types/models'
import { useLogsInRange } from './useData'

/** How far back the catalog looks for "last trained" and history. */
export const EXERCISE_HISTORY_DAYS = 90
const NO_SESSIONS: ExerciseSession[] = []

/** Muscle groups that at least one exercise trains as primary muscle; only these get a filter. */
export const FILTERABLE_MUSCLES = MUSCLE_GROUPS.filter((group) => EXERCISES.some((exercise) => exercise.primaryMuscle === group))

export type MuscleFilter = MuscleGroup | 'all'

/**
 * The fixed catalog joined with the user's recent history from Firestore, plus search and
 * muscle filter state. Secondary muscles match too, so filtering by shoulders also lists the
 * pressing moves that work them.
 */
export function useExercises(userId: string) {
  const today = todayKey()
  const { logs, ready } = useLogsInRange(userId, addDays(today, -(EXERCISE_HISTORY_DAYS - 1)), today)
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleFilter>('all')

  const history = useMemo(() => buildExerciseHistory(logs), [logs])
  const todayLog = logs.find((log) => log.date === today) ?? null
  const todayIds = useMemo(() => new Set(todayLog?.entries.map((entry) => entry.exerciseId)), [todayLog])

  const term = search.trim().toLowerCase()
  const exercises = useMemo(
    () =>
      EXERCISES.filter(
        (exercise) =>
          (muscle === 'all' || exercise.primaryMuscle === muscle || exercise.secondaryMuscles.includes(muscle)) &&
          (!term || exercise.searchTerms.some((searchTerm) => searchTerm.includes(term))),
      ),
    [muscle, term],
  )

  const sessionsOf = useCallback((exerciseId: string) => history.get(exerciseId) ?? NO_SESSIONS, [history])

  const resetFilters = useCallback(() => {
    setSearch('')
    setMuscle('all')
  }, [])

  /** Appends the exercise to today's log. The write is optimistic (offline cache), so callers needn't wait. */
  const addToToday = useCallback(
    (exercise: Exercise) => {
      const entries = todayLog?.entries ?? []
      return repository.saveLog(buildWorkoutLog(userId, today, [...entries, createEntry(exercise, entries.length)], todayLog))
    },
    [userId, today, todayLog],
  )

  return {
    ready,
    exercises,
    totalCount: EXERCISES.length,
    isFiltered: muscle !== 'all' || term !== '',
    search,
    setSearch,
    muscle,
    setMuscle,
    resetFilters,
    sessionsOf,
    isAddedToday: (exerciseId: string) => todayIds.has(exerciseId),
    addToToday,
  }
}
