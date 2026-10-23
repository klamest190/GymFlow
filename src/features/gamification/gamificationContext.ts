import { createContext, useContext } from 'react'
import type { ProgressEvaluation } from '../../services/gamificationService'

/** `null` while the training history is still loading. */
export const GamificationContext = createContext<ProgressEvaluation | null | undefined>(undefined)

export function useGamification(): ProgressEvaluation | null {
  const value = useContext(GamificationContext)
  if (value === undefined) throw new Error('useGamification must be used inside <GamificationProvider>')
  return value
}
