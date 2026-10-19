import { isFirebaseConfigured } from '../lib/firebase'
import type { AccountInfo, DateKey, LinkResult, UserProfile, WorkoutLog } from '../types/models'
import { createFirestoreRepository } from './firestoreRepository'
import { createLocalRepository } from './localRepository'

export type Unsubscribe = () => void

/**
 * Storage abstraction so the UI never talks to Firestore directly. Only user data lives here;
 * the exercise catalog is static (`data/exercises.ts`).
 */
export interface GymflowRepository {
  mode: 'firebase' | 'local'

  // ─── Auth ───
  /** Resolves with the current user's uid, signing in anonymously if needed. */
  signIn(): Promise<string>
  subscribeAccount(onChange: (account: AccountInfo) => void): Unsubscribe
  /** Upgrades the anonymous account to Google so the data survives a device change. */
  linkWithGoogle(): Promise<LinkResult>
  /** Signs out; the caller reloads the app, which then starts a fresh anonymous session. */
  signOut(): Promise<void>

  // ─── users/{uid} ───
  /** Emits `null` while no profile document exists yet (callers fall back to defaults). */
  subscribeProfile(userId: string, onChange: (profile: UserProfile | null) => void): Unsubscribe
  saveProfile(userId: string, changes: Pick<UserProfile, 'weeklyGoalDays'>): Promise<void>

  // ─── users/{uid}/workout_logs ───
  /** All logs with `from <= date <= to` (inclusive). */
  subscribeLogs(userId: string, from: DateKey, to: DateKey, onChange: (logs: WorkoutLog[]) => void): Unsubscribe
  /** Writes the whole day document; an empty day deletes it so analytics only see real training days. */
  saveLog(log: WorkoutLog): Promise<void>
}

export const repository: GymflowRepository = isFirebaseConfigured ? createFirestoreRepository() : createLocalRepository()
