import { isFirebaseConfigured } from '../lib/firebase'
import type { DateKey, WorkoutLog } from '../types/models'
import { createFirestoreRepository } from './firestoreRepository'
import { createLocalRepository } from './localRepository'

export type Unsubscribe = () => void

/**
 * Storage abstraction so the UI never talks to Firestore directly. Only user data lives here;
 * the exercise catalog is static (`data/exercises.ts`).
 */
export interface GymflowRepository {
  mode: 'firebase' | 'local'
  /** Resolves with the current user's uid, signing in anonymously if needed. */
  signIn(): Promise<string>
  /** All logs with `from <= date <= to` (inclusive). */
  subscribeLogs(userId: string, from: DateKey, to: DateKey, onChange: (logs: WorkoutLog[]) => void): Unsubscribe
  /** Writes the whole day document; an empty day deletes it so analytics only see real training days. */
  saveLog(log: WorkoutLog): Promise<void>
}

export const repository: GymflowRepository = isFirebaseConfigured ? createFirestoreRepository() : createLocalRepository()
