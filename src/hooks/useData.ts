import { useEffect, useState } from 'react'
import { repository } from '../services/repository'
import type { DateKey, UserProfile, WorkoutLog } from '../types/models'

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
