import { createContext, useContext } from 'react'
import type { ProgressEvaluation } from '../../services/gamificationService'
import type { WorkoutLog } from '../../types/models'

export interface GamificationValue extends ProgressEvaluation {
  /** The whole training history; shared with the weekly recap and the export, so it loads once. */
  logs: WorkoutLog[]
}

/** `null` while the training history is still loading. */
export const GamificationContext = createContext<GamificationValue | null | undefined>(undefined)

export function useGamification(): GamificationValue | null {
  const value = useContext(GamificationContext)
  if (value === undefined) throw new Error('useGamification must be used inside <GamificationProvider>')
  return value
}
