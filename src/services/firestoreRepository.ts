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
  getDoc,
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
import { isEmailLogin, isValidUsername, normalizeUsername } from '../lib/usernames'
import { DEFAULT_WEEKLY_GOAL_DAYS, RANK_IDS, type GamificationState, type RankId, type UserProfile, type WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

export const COLLECTIONS = {
  users: 'users',
  workoutLogs: 'workout_logs',
  usernames: 'usernames',
} as const

const logError = (context: string) => (error: Error) => console.error(`[GymFlow] ${context}`, error)

/** Error with a Firebase-style code, so `authErrorMessage` maps it like any other. */
const codeError = (code: string) => Object.assign(new Error(code), { code })

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : Date.now())
const toMillisOrNull = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : null)

/** Reads a document with pending server timestamps estimated locally instead of `null`. */
function readDoc<T>(snapshot: DocumentSnapshot<DocumentData>): T {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return { ...data, id: snapshot.id, createdAt: toMillis(data.createdAt), updatedAt: toMillis(data.updatedAt) } as T
}

/** `null` until the client synced the gamification fields once (see `GamificationState`). */
function readGamification(data: DocumentData): GamificationState | null {
  if (typeof data.totalXP !== 'number') return null
  return {
    currentXP: data.currentXP ?? 0,
    totalXP: data.totalXP,
    level: data.level ?? 1,
    rank: RANK_IDS.includes(data.rank) ? (data.rank as RankId) : 'iron',
    unlockedAchievements: data.unlockedAchievements ?? {},
  }
}

function readProfile(snapshot: DocumentSnapshot<DocumentData>): UserProfile {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return {
    id: snapshot.id,
    email: data.email ?? '',
    username: typeof data.username === 'string' ? data.username : null,
    displayName: data.displayName ?? '',
    role: data.role === 'admin' ? 'admin' : 'user',
    status: data.status === 'active' ? 'active' : 'disabled',
    weeklyGoalDays: data.weeklyGoalDays ?? DEFAULT_WEEKLY_GOAL_DAYS,
    createdAt: toMillis(data.createdAt),
    createdBy: data.createdBy ?? null,
    updatedAt: toMillis(data.updatedAt),
    lastLoginAt: toMillisOrNull(data.lastLoginAt),
    gamification: readGamification(data),
  }
}

export function createFirestoreRepository(): GymflowRepository {
  const { app, db, auth } = getFirebase()
  const userDoc = (userId: string) => doc(db, COLLECTIONS.users, userId)
  const logsCollection = (userId: string) => collection(db, COLLECTIONS.users, userId, COLLECTIONS.workoutLogs)
  const usernameDoc = (username: string) => doc(db, COLLECTIONS.usernames, username)

  const usernameTaken = async (username: string) => (await getDoc(usernameDoc(username))).exists()

  /**
   * The login e-mail for an e-mail or username, `null` for unknown usernames. Runs before sign-in,
   * which is why the rules allow single, unauthenticated reads of `usernames/{username}`.
   */
  async function resolveLoginEmail(login: string): Promise<string | null> {
    const value = login.trim()
    if (isEmailLogin(value)) return value
    const username = normalizeUsername(value)
    if (!isValidUsername(username)) return null
    const mapping = await getDoc(usernameDoc(username))
    return mapping.exists() ? (mapping.data().email as string) : null
  }

  return {
    mode: 'firebase',

    onAuthChange(onChange) {
      return onAuthStateChanged(auth, (user) => onChange(user ? { uid: user.uid, email: user.email } : null))
    },

    async signIn(login, password) {
      const email = await resolveLoginEmail(login)
      if (!email) throw codeError('auth/invalid-credential')
      await signInWithEmailAndPassword(auth, email, password)
    },

    async signOut() {
      await signOut(auth)
    },

    async sendPasswordReset(login) {
      const email = await resolveLoginEmail(login)
      if (!email) throw codeError('auth/user-not-found')
      await sendPasswordResetEmail(auth, email)
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

    async saveGamification(userId, state) {
      // Flat fields; `updatedAt` stays untouched, it tracks changes to the account itself.
      await updateDoc(userDoc(userId), { ...state })
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
      const username = normalizeUsername(input.username)
      const displayName = input.displayName.trim()
      try {
        // Checked before the login exists, so a taken name never leaves a login behind. A race with
        // another admin is still caught by the rules (the mapping can't be overwritten) + rollback.
        if (await usernameTaken(username)) throw codeError('username-taken')
        const provisioningAuth = initializeAuth(provisioning, { persistence: inMemoryPersistence })
        const credential = await createUserWithEmailAndPassword(provisioningAuth, email, input.password)
        const uid = credential.user.uid
        try {
          const batch = writeBatch(db)
          batch.set(userDoc(uid), {
            email,
            username,
            displayName,
            role: input.role,
            status: 'active',
            weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
            createdAt: serverTimestamp(),
            createdBy: adminId,
            updatedAt: serverTimestamp(),
            lastLoginAt: null,
          })
          batch.set(usernameDoc(username), { uid, email })
          await batch.commit()
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
          username,
          displayName,
          role: input.role,
          status: 'active',
          weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
          createdAt: now,
          createdBy: adminId,
          updatedAt: now,
          lastLoginAt: null,
          gamification: null,
        }
      } finally {
        await deleteApp(provisioning)
      }
    },

    async updateUser(userId, changes) {
      await updateDoc(userDoc(userId), { ...changes, updatedAt: serverTimestamp() })
    },

    async setUsername(user, username) {
      const next = normalizeUsername(username)
      if (next === user.username) return
      if (await usernameTaken(next)) throw codeError('username-taken')
      // One batch, so account and mapping never disagree (the rules check both sides).
      const batch = writeBatch(db)
      if (user.username) batch.delete(usernameDoc(user.username))
      batch.set(usernameDoc(next), { uid: user.id, email: user.email })
      batch.update(userDoc(user.id), { username: next, updatedAt: serverTimestamp() })
      await batch.commit()
    },

    async deleteUser(userId) {
      // Batches are limited to 500 writes; one doc per training day stays far below that per chunk.
      const logs = await getDocs(logsCollection(userId))
      for (let index = 0; index < logs.docs.length; index += 450) {
        const batch = writeBatch(db)
        logs.docs.slice(index, index + 450).forEach((log) => batch.delete(log.ref))
        await batch.commit()
      }
      const username = (await getDoc(userDoc(userId))).data()?.username
      const batch = writeBatch(db)
      if (typeof username === 'string') batch.delete(usernameDoc(username))
      batch.delete(userDoc(userId))
      await batch.commit()
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
