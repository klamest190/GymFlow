import { createContext, useContext } from 'react'

/** Opens the first-run tour again (e.g. from the profile); doesn't touch the stored completion. */
export const OnboardingContext = createContext<(() => void) | null>(null)

export function useReplayOnboarding(): () => void {
  const replay = useContext(OnboardingContext)
  if (!replay) throw new Error('useReplayOnboarding must be used inside the signed-in app')
  return replay
}
