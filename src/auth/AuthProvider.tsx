import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { repository } from '../services/repository'
import type { AuthState, AuthUser, UserProfile } from '../types/models'
import { AuthContext, type AuthContextValue } from './authContext'

/**
 * Combines the Firebase Auth identity with the live `users/{uid}` account document:
 * - signed in + active document → 'signed-in' (role from the document)
 * - signed in + missing/disabled document → 'no-access' (rules block all data anyway)
 * Because the document is subscribed live, disabling a user by an admin locks them out at once.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // `undefined` until Firebase has restored (or ruled out) a persisted session.
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined)
  const [account, setAccount] = useState<{ uid: string; profile: UserProfile | null } | null>(null)
  const recordedLogins = useRef(new Set<string>())

  useEffect(() => repository.onAuthChange(setAuthUser), [])

  const uid = authUser?.uid
  useEffect(() => {
    if (!uid) return
    return repository.subscribeProfile(
      uid,
      (profile) => setAccount({ uid, profile }),
      (error) => {
        console.error('[GymFlow] reading account document failed', error)
        setAccount({ uid, profile: null })
      },
    )
  }, [uid])

  const state = useMemo<AuthState>(() => {
    if (authUser === undefined) return { status: 'loading' }
    if (authUser === null) return { status: 'signed-out' }
    // The account document of this uid hasn't arrived yet (e.g. right after signing in).
    if (account?.uid !== authUser.uid) return { status: 'loading' }
    const { profile } = account
    if (!profile) return { status: 'no-access', user: authUser, reason: 'missing-profile' }
    if (profile.status !== 'active') return { status: 'no-access', user: authUser, reason: 'disabled' }
    return { status: 'signed-in', user: authUser, profile, isAdmin: profile.role === 'admin' }
  }, [authUser, account])

  // "Zuletzt aktiv" for the admin list: once per app start and account.
  useEffect(() => {
    if (state.status !== 'signed-in' || recordedLogins.current.has(state.user.uid)) return
    recordedLogins.current.add(state.user.uid)
    repository.recordLogin(state.user.uid).catch((error) => console.error('[GymFlow] recording login failed', error))
  }, [state])

  const signIn = useCallback((login: string, password: string) => repository.signIn(login, password), [])
  const signOut = useCallback(() => repository.signOut(), [])
  const sendPasswordReset = useCallback((login: string) => repository.sendPasswordReset(login), [])

  const value = useMemo<AuthContextValue>(
    () => ({ state, signIn, signOut, sendPasswordReset }),
    [state, signIn, signOut, sendPasswordReset],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
