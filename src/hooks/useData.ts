import { useEffect, useState } from 'react'
import { repository } from '../services/repository'
import type { BodyWeightEntry, DateKey, UserProfile, WorkoutLog, WorkoutTemplate } from '../types/models'

/** Live logs within an inclusive date range; `ready` is false until the current range has loaded. */
export function useLogsInRange(userId: string, from: DateKey, to: DateKey) {
  const range = `${from}|${to}`
  const [state, setState] = useState<{ range: string; logs: WorkoutLog[] }>({ range: '', logs: [] })

  useEffect(() => repository.subscribeLogs(userId, from, to, (logs) => setState({ range, logs })), [userId, from, to, range])

  const ready = state.range === range
  return { logs: ready ? state.logs : [], ready }
}

/** The whole training history (one small document per training day), e.g. for lifetime XP. */
export const useAllLogs = (userId: string) => useLogsInRange(userId, '0000-01-01', '9999-12-31')

/** Live list from a per-user subscription; `null` until the first snapshot arrived. */
function useUserCollection<T>(userId: string, subscribe: (userId: string, onChange: (items: T[]) => void) => () => void) {
  const [state, setState] = useState<{ userId: string; items: T[] } | null>(null)
  useEffect(() => subscribe(userId, (items) => setState({ userId, items })), [userId, subscribe])
  return state?.userId === userId ? state.items : null
}

const subscribeTemplates = repository.subscribeTemplates.bind(repository)
const subscribeBodyWeights = repository.subscribeBodyWeights.bind(repository)

/** The user's own workout templates, newest first. */
export const useTemplates = (userId: string) => useUserCollection<WorkoutTemplate>(userId, subscribeTemplates)

/** All weigh-ins, oldest first. */
export const useBodyWeights = (userId: string) => useUserCollection<BodyWeightEntry>(userId, subscribeBodyWeights)

/** All accounts (admin only); `error` is set if the rules reject the listing. */
export function useAllUsers() {
  const [state, setState] = useState<{ users: UserProfile[] | null; error: Error | null }>({ users: null, error: null })
  useEffect(
    () =>
      repository.subscribeUsers(
        (users) => setState({ users, error: null }),
        (error) => setState({ users: null, error }),
      ),
    [],
  )
  return state
}
