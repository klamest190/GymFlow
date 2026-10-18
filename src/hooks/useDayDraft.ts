import { useCallback, useEffect, useRef, useState } from 'react'
import { buildWorkoutLog } from '../lib/workoutMath'
import { repository } from '../services/repository'
import type { DateKey, WorkoutEntry, WorkoutLog } from '../types/models'

export type SyncState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const SAVE_DELAY_MS = 450

interface PendingSave {
  date: DateKey
  entries: WorkoutEntry[]
  previous: WorkoutLog | null
}

/**
 * Local, optimistic editing state for one day. Edits render instantly and are
 * written as one document after a short debounce, so rapid stepper taps cost a
 * single Firestore write. Remote updates are applied whenever nothing is pending.
 */
export function useDayDraft(userId: string, date: DateKey, remote: WorkoutLog | null, ready: boolean) {
  const [entries, setEntries] = useState<WorkoutEntry[]>(remote?.entries ?? [])
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const entriesRef = useRef(entries)
  const remoteRef = useRef(remote)
  const pendingRef = useRef<PendingSave | null>(null)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    remoteRef.current = remote
  }, [remote])

  const flush = useCallback(() => {
    window.clearTimeout(timerRef.current)
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = null
    setSyncState('saving')
    repository
      .saveLog(buildWorkoutLog(userId, pending.date, pending.entries, pending.previous))
      .then(() => setSyncState((state) => (state === 'saving' ? 'saved' : state)))
      .catch((error) => {
        console.error('[GymFlow] saving workout log failed', error)
        setSyncState('error')
      })
  }, [userId])

  // Adopt remote data for the selected day unless local edits are waiting to be saved.
  useEffect(() => {
    if (pendingRef.current?.date === date) return
    const next = remote?.entries ?? []
    entriesRef.current = next
    setEntries(next)
  }, [date, remote])

  // Save immediately when switching days, unmounting, or leaving the page.
  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [date, flush])

  const update = useCallback(
    (recipe: (entries: WorkoutEntry[]) => WorkoutEntry[]) => {
      if (!ready) return // never overwrite a day before its stored version has loaded
      const next = recipe(entriesRef.current)
      entriesRef.current = next
      setEntries(next)
      pendingRef.current = { date, entries: next, previous: remoteRef.current }
      setSyncState('pending')
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(flush, SAVE_DELAY_MS)
    },
    [date, flush, ready],
  )

  return { entries, update, syncState }
}
