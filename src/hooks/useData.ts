import { useEffect, useState } from 'react'
import { repository } from '../services/repository'
import { DEFAULT_PROFILE, type AccountInfo, type DateKey, type UserProfile, type WorkoutLog } from '../types/models'

/** Live logs within an inclusive date range; `ready` is false until the current range has loaded. */
export function useLogsInRange(userId: string, from: DateKey, to: DateKey) {
  const range = `${from}|${to}`
  const [state, setState] = useState<{ range: string; logs: WorkoutLog[] }>({ range: '', logs: [] })

  useEffect(() => repository.subscribeLogs(userId, from, to, (logs) => setState({ range, logs })), [userId, from, to, range])

  const ready = state.range === range
  return { logs: ready ? state.logs : [], ready }
}

/** The user's profile with defaults filled in for fields that were never saved. */
export function useProfile(userId: string): UserProfile {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  useEffect(() => repository.subscribeProfile(userId, setProfile), [userId])
  return { ...DEFAULT_PROFILE, ...profile }
}

/** Current auth account; `null` until the first auth event. */
export function useAccount(): AccountInfo | null {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  useEffect(() => repository.subscribeAccount(setAccount), [])
  return account
}
