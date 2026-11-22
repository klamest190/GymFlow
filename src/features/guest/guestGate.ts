import { createContext, useContext } from 'react'
import { GUEST_EXERCISE_IDS } from '../../data/guest'
import type { Exercise } from '../../types/models'

/** What a guest tapped on; picks the reason the upgrade sheet opens with. */
export type LockedFeature = { kind: 'exercise'; exercise: Exercise } | { kind: 'stats' } | { kind: 'templates' } | { kind: 'export' } | { kind: 'all' }

export interface GuestGate {
  isGuest: boolean
  /** Locked for this session: only guests have locked exercises. */
  isLocked(exerciseId: string): boolean
  /** Explains what an account unlocks, with the way to the login. */
  showUpgrade(feature: LockedFeature): void
}

export const isExerciseLockedFor = (isGuest: boolean, exerciseId: string) => isGuest && !GUEST_EXERCISE_IDS.has(exerciseId)

export const GuestGateContext = createContext<GuestGate | null>(null)

export function useGuestGate(): GuestGate {
  const gate = useContext(GuestGateContext)
  if (!gate) throw new Error('useGuestGate must be used inside <GuestGateProvider>')
  return gate
}
