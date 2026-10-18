import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { getFirebase } from '../lib/firebase'
import type { WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

export const COLLECTIONS = {
  users: 'users',
  workoutLogs: 'workout_logs',
} as const

const logError = (context: string) => (error: Error) => console.error(`[GymFlow] ${context}`, error)

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : Date.now())

/** Reads a document with pending server timestamps estimated locally instead of `null`. */
function readDoc<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  const data = snapshot.data({ serverTimestamps: 'estimate' })
  return { ...data, id: snapshot.id, createdAt: toMillis(data.createdAt), updatedAt: toMillis(data.updatedAt) } as T
}

export function createFirestoreRepository(): GymflowRepository {
  const { db, auth } = getFirebase()

  return {
    mode: 'firebase',

    signIn() {
      return new Promise((resolve, reject) => {
        const stop = onAuthStateChanged(auth, (user) => {
          if (user) {
            stop()
            resolve(user.uid)
          } else {
            signInAnonymously(auth).catch((error) => {
              stop()
              reject(error)
            })
          }
        })
      })
    },

    subscribeLogs(userId, from, to, onChange) {
      // Range on a single field inside the user's own subcollection: no composite index needed.
      const logs = query(
        collection(db, COLLECTIONS.users, userId, COLLECTIONS.workoutLogs),
        where('date', '>=', from),
        where('date', '<=', to),
      )
      return onSnapshot(
        logs,
        (snap) => onChange(snap.docs.map((d) => readDoc<WorkoutLog>(d))),
        logError('workout logs'),
      )
    },

    async saveLog(log) {
      const ref = doc(db, COLLECTIONS.users, log.userId, COLLECTIONS.workoutLogs, log.id)
      if (log.entries.length === 0) {
        await deleteDoc(ref)
        return
      }
      const { id: _id, ...data } = log
      await setDoc(ref, {
        ...data,
        createdAt: Timestamp.fromMillis(log.createdAt),
        updatedAt: serverTimestamp(),
      })
    },
  }
}
