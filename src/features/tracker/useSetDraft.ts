import { useCallback, useSyncExternalStore } from 'react'
import { parseSetDrafts, withDraft, type SetDrafts } from '../../lib/setDrafts'
import type { WorkoutSet } from '../../types/models'

type SetValues = Pick<WorkoutSet, 'reps' | 'weightKg'>

const DRAFTS_KEY = 'gymflow:setDrafts'

function readStored(): string | null {
  try {
    return localStorage.getItem(DRAFTS_KEY)
  } catch {
    return null
  }
}

let drafts: SetDrafts = parseSetDrafts(readStored(), Date.now())
const listeners = new Set<() => void>()

function save(next: SetDrafts) {
  drafts = next
  try {
    if (Object.keys(next).length === 0) localStorage.removeItem(DRAFTS_KEY)
    else localStorage.setItem(DRAFTS_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked: the draft still lives in memory until the app closes.
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  return () => void listeners.delete(onChange)
}

/** The next set of one entry while it is being entered; it outlives the card (tab switches, reloads). */
export function useSetDraft(entryId: string) {
  const stored = useSyncExternalStore(subscribe, () => drafts[entryId])
  const draft: SetValues | null = stored ? { reps: stored.reps, weightKg: stored.weightKg } : null
  const setDraft = useCallback((values: SetValues | null) => save(withDraft(drafts, entryId, values, Date.now())), [entryId])
  return [draft, setDraft] as const
}
