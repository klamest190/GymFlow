import { createContext, useContext } from 'react'
import type { RestState } from '../../lib/restTimer'

export interface RestTimerValue {
  /** The running (or just finished) rest; `null` when none is shown. */
  rest: RestState | null
  /** Rest length setting in seconds (per device). */
  restSeconds: number
  setRestSeconds: (seconds: number) => void
  /** Starts a new rest; call it inside the tap that logged the set (unlocks the end signal on iOS). */
  start: (label: string) => void
  adjust: (deltaSeconds: number) => void
  dismiss: () => void
}

export const RestTimerContext = createContext<RestTimerValue | null>(null)

export function useRestTimer(): RestTimerValue {
  const value = useContext(RestTimerContext)
  if (!value) throw new Error('useRestTimer must be used inside <RestTimerProvider>')
  return value
}
