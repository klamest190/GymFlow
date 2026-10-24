import { isFirebaseConfigured } from '../lib/firebase'
import type {
  AuthUser,
  BodyWeightEntry,
  DateKey,
  GamificationState,
  NewUserInput,
  UserProfile,
  UserUpdate,
  WorkoutLog,
  WorkoutTemplate,
} from '../types/models'
import { createFirestoreRepository } from './firestoreRepository'
import { createLocalRepository } from './localRepository'

export type Unsubscribe = () => void

/**
 * Storage abstraction so the UI never talks to Firebase directly. Only user data lives here;
 * the exercise catalog is static (`data/exercises.ts`).
 */
export interface GymflowRepository {
  mode: 'firebase' | 'local'

  // ─── Auth (username or e-mail + password, no self sign-up) ───
  /** Emits the signed-in identity, or `null` when signed out. */
  onAuthChange(onChange: (user: AuthUser | null) => void): Unsubscribe
  /**
   * `login` is an e-mail (contains @) or a username. Unknown usernames fail with
   * `auth/invalid-credential`, like a wrong password, so the UI can't tell them apart.
   */
  signIn(login: string, password: string): Promise<void>
  signOut(): Promise<void>
  /** Sends Firebase's password reset mail (German template); `login` as in `signIn`. */
  sendPasswordReset(login: string): Promise<void>

  // ─── users/{uid}: own account ───
  /** Emits `null` if the account document doesn't exist (not provisioned or deleted). */
  subscribeProfile(userId: string, onChange: (profile: UserProfile | null) => void, onError: (error: Error) => void): Unsubscribe
  saveProfile(userId: string, changes: Pick<UserProfile, 'weeklyGoalDays'>): Promise<void>
  recordLogin(userId: string): Promise<void>
  /** Marks the first-run tour as done for good (server timestamp). */
  completeOnboarding(userId: string): Promise<void>
  /** Mirrors the derived XP/level/rank/achievements into the account document. */
  saveGamification(userId: string, state: GamificationState): Promise<void>

  // ─── users: admin only (enforced by the security rules) ───
  subscribeUsers(onChange: (users: UserProfile[]) => void, onError: (error: Error) => void): Unsubscribe
  /**
   * Creates the login, the account document and the username mapping; the admin stays signed in.
   * Fails with `username-taken` before creating anything if the username is in use.
   */
  createUser(input: NewUserInput, adminId: string): Promise<UserProfile>
  updateUser(userId: string, changes: UserUpdate): Promise<void>
  /** Sets or renames the username (moves the mapping); fails with `username-taken`. */
  setUsername(user: UserProfile, username: string): Promise<void>
  /**
   * Deletes the account document, its username and all its data (logs, templates, body weights),
   * which removes every access.
   * The Auth login itself can only be deleted server-side (Firebase Console) on the free plan.
   */
  deleteUser(userId: string): Promise<void>

  // ─── users/{uid}/workout_logs ───
  /** All logs with `from <= date <= to` (inclusive). */
  subscribeLogs(userId: string, from: DateKey, to: DateKey, onChange: (logs: WorkoutLog[]) => void): Unsubscribe
  /** Writes the whole day document; an empty day deletes it so analytics only see real training days. */
  saveLog(log: WorkoutLog): Promise<void>

  // ─── users/{uid}/templates ───
  /** Own templates, newest first (built-ins come from data/templates.ts). */
  subscribeTemplates(userId: string, onChange: (templates: WorkoutTemplate[]) => void): Unsubscribe
  saveTemplate(userId: string, template: Pick<WorkoutTemplate, 'name' | 'exercises'>): Promise<void>
  deleteTemplate(userId: string, templateId: string): Promise<void>

  // ─── users/{uid}/body_weights ───
  /** All weigh-ins, oldest first. */
  subscribeBodyWeights(userId: string, onChange: (entries: BodyWeightEntry[]) => void): Unsubscribe
  /** One entry per day; saving the same day again overwrites it. */
  saveBodyWeight(userId: string, date: DateKey, weightKg: number): Promise<void>
  deleteBodyWeight(userId: string, date: DateKey): Promise<void>
}

export const repository: GymflowRepository = isFirebaseConfigured ? createFirestoreRepository() : createLocalRepository()
