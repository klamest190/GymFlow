import { createContext, useContext } from 'react'
import type { AuthState, AuthUser, UserProfile } from '../types/models'

export interface AuthContextValue {
  state: AuthState
  /** `login`: username or e-mail. */
  signIn(login: string, password: string): Promise<void>
  signOut(): Promise<void>
  sendPasswordReset(login: string): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

export interface Session {
  user: AuthUser
  profile: UserProfile
  /**
   * UI hint only (show/hide admin screens). The security rules enforce the role on every
   * request, so a manipulated client gains nothing.
   */
  isAdmin: boolean
}

/** The active session; only valid below the signed-in gate in App.tsx. */
export function useSession(): Session {
  const { state } = useAuth()
  if (state.status !== 'signed-in') throw new Error('useSession requires a signed-in user')
  return { user: state.user, profile: state.profile, isAdmin: state.isAdmin }
}

export const useUserId = () => useSession().user.uid
