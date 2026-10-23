import { useEffect, useState } from 'react'

/**
 * Data from Firestore's local cache usually arrives within a few milliseconds. Showing a
 * skeleton for that would only flash, so it appears once loading took longer than this.
 */
export const SKELETON_DELAY_MS = 280

/** `true` only after `active` has stayed true for `delayMs`; resets as soon as it turns false. */
export function useDelayedFlag(active: boolean, delayMs = SKELETON_DELAY_MS): boolean {
  const [elapsed, setElapsed] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => setElapsed(true), delayMs)
    return () => {
      window.clearTimeout(timer)
      setElapsed(false)
    }
  }, [active, delayMs])

  return active && elapsed
}
