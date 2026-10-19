import { deleteApp, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { getFirebase } from '../lib/firebase'
import { DEFAULT_WEEKLY_GOAL_DAYS, type UserProfile, type WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

export const COLLECTIONS = {
  users: 'users',
  workoutLogs: 'workout_logs',
} as const

const logError = (context: string) => (error: Error) => console.error(`[GymFlow] ${context}`, error)

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : Date.now())
const toMillisOrNull = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : null)

/** Reads a document with pending server timestamps estimated locally instead of `null`. */
function readDoc<T>(snapshot: DocumentSnapshot<DocumentData>): T {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return { ...data, id: snapshot.id, createdAt: toMillis(data.createdAt), updatedAt: toMillis(data.updatedAt) } as T
}

function readProfile(snapshot: DocumentSnapshot<DocumentData>): UserProfile {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return {
    id: snapshot.id,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
    role: data.role === 'admin' ? 'admin' : 'user',
    status: data.status === 'active' ? 'active' : 'disabled',
    weeklyGoalDays: data.weeklyGoalDays ?? DEFAULT_WEEKLY_GOAL_DAYS,
    createdAt: toMillis(data.createdAt),
    createdBy: data.createdBy ?? null,
    updatedAt: toMillis(data.updatedAt),
    lastLoginAt: toMillisOrNull(data.lastLoginAt),
  }
}

export function createFirestoreRepository(): GymflowRepository {
  const { app, db, auth } = getFirebase()
  const userDoc = (userId: string) => doc(db, COLLECTIONS.users, userId)
  const logsCollection = (userId: string) => collection(db, COLLECTIONS.users, userId, COLLECTIONS.workoutLogs)

  return {
    mode: 'firebase',

    onAuthChange(onChange) {
      return onAuthStateChanged(auth, (user) => onChange(user ? { uid: user.uid, email: user.email } : null))
    },

    async signInWithEmail(email, password) {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },

    async signOut() {
      await signOut(auth)
    },

    async sendPasswordReset(email) {
      await sendPasswordResetEmail(auth, email.trim())
    },

    subscribeProfile(userId, onChange, onError) {
      return onSnapshot(userDoc(userId), (snap) => onChange(snap.exists() ? readProfile(snap) : null), onError)
    },

    async saveProfile(userId, changes) {
      await updateDoc(userDoc(userId), { ...changes, updatedAt: serverTimestamp() })
    },

    async recordLogin(userId) {
      await updateDoc(userDoc(userId), { lastLoginAt: serverTimestamp() })
    },

    subscribeUsers(onChange, onError) {
      return onSnapshot(
        collection(db, COLLECTIONS.users),
        (snap) => onChange(snap.docs.map(readProfile).sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'))),
        onError,
      )
    },

    async createUser(input, adminId) {
      // A throwaway app instance with in-memory auth: creating a login there doesn't replace the
      // admin's own session (createUserWithEmailAndPassword always signs the new user in).
      const provisioning = initializeApp(app.options, `user-provisioning-${Date.now()}`)
      const email = input.email.trim().toLowerCase()
      const displayName = input.displayName.trim()
      try {
        const provisioningAuth = initializeAuth(provisioning, { persistence: inMemoryPersistence })
        const credential = await createUserWithEmailAndPassword(provisioningAuth, email, input.password)
        const uid = credential.user.uid
        try {
          await setDoc(userDoc(uid), {
            email,
            displayName,
            role: input.role,
            status: 'active',
            weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
            createdAt: serverTimestamp(),
            createdBy: adminId,
            updatedAt: serverTimestamp(),
            lastLoginAt: null,
          })
        } catch (error) {
          // Roll back: the new user is still signed in on the throwaway instance and may delete
          // their own login, so no orphaned login without account document is left behind.
          await credential.user.delete().catch(logError('rollback of new login'))
          throw error
        }
        await signOut(provisioningAuth)
        const now = Date.now()
        return {
          id: uid,
          email,
          displayName,
          role: input.role,
          status: 'active',
          weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
          createdAt: now,
          createdBy: adminId,
          updatedAt: now,
          lastLoginAt: null,
        }
      } finally {
        await deleteApp(provisioning)
      }
    },

    async updateUser(userId, changes) {
      await updateDoc(userDoc(userId), { ...changes, updatedAt: serverTimestamp() })
    },

    async deleteUser(userId) {
      // Batches are limited to 500 writes; one doc per training day stays far below that per chunk.
      const logs = await getDocs(logsCollection(userId))
      for (let index = 0; index < logs.docs.length; index += 450) {
        const batch = writeBatch(db)
        logs.docs.slice(index, index + 450).forEach((log) => batch.delete(log.ref))
        await batch.commit()
      }
      await deleteDoc(userDoc(userId))
    },

    subscribeLogs(userId, from, to, onChange) {
      // Range on a single field inside the user's own subcollection: no composite index needed.
      const logs = query(logsCollection(userId), where('date', '>=', from), where('date', '<=', to))
      return onSnapshot(
        logs,
        (snap) => onChange(snap.docs.map((d) => readDoc<WorkoutLog>(d))),
        logError('workout logs'),
      )
    },

    async saveLog(log) {
      const ref = doc(logsCollection(log.userId), log.id)
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
