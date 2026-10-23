import { isFirebaseConfigured } from '../lib/firebase'
import type { AuthUser, DateKey, GamificationState, NewUserInput, UserProfile, UserUpdate, WorkoutLog } from '../types/models'
import { createFirestoreRepository } from './firestoreRepository'
import { createLocalRepository } from './localRepository'

export type Unsubscribe = () => void

/**
 * Storage abstraction so the UI never talks to Firebase directly. Only user data lives here;
 * the exercise catalog is static (`data/exercises.ts`).
 */
export interface GymflowRepository {
  mode: 'firebase' | 'local'

  // ─── Auth (e-mail/password, no self sign-up) ───
  /** Emits the signed-in identity, or `null` when signed out. */
  onAuthChange(onChange: (user: AuthUser | null) => void): Unsubscribe
  signInWithEmail(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  /** Sends Firebase's password reset mail (German template). */
  sendPasswordReset(email: string): Promise<void>

  // ─── users/{uid}: own account ───
  /** Emits `null` if the account document doesn't exist (not provisioned or deleted). */
  subscribeProfile(userId: string, onChange: (profile: UserProfile | null) => void, onError: (error: Error) => void): Unsubscribe
  saveProfile(userId: string, changes: Pick<UserProfile, 'weeklyGoalDays'>): Promise<void>
  recordLogin(userId: string): Promise<void>
  /** Mirrors the derived XP/level/rank/achievements into the account document. */
  saveGamification(userId: string, state: GamificationState): Promise<void>

  // ─── users: admin only (enforced by the security rules) ───
  subscribeUsers(onChange: (users: UserProfile[]) => void, onError: (error: Error) => void): Unsubscribe
  /** Creates the login and the account document; the admin stays signed in. */
  createUser(input: NewUserInput, adminId: string): Promise<UserProfile>
  updateUser(userId: string, changes: UserUpdate): Promise<void>
  /**
   * Deletes the account document and all workout logs, which removes every access. The Auth
   * login itself can only be deleted server-side (Firebase Console) on the free plan.
   */
  deleteUser(userId: string): Promise<void>

  // ─── users/{uid}/workout_logs ───
  /** All logs with `from <= date <= to` (inclusive). */
  subscribeLogs(userId: string, from: DateKey, to: DateKey, onChange: (logs: WorkoutLog[]) => void): Unsubscribe
  /** Writes the whole day document; an empty day deletes it so analytics only see real training days. */
  saveLog(log: WorkoutLog): Promise<void>
}

export const repository: GymflowRepository = isFirebaseConfigured ? createFirestoreRepository() : createLocalRepository()
