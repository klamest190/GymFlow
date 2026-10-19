import type { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  linkWithPopup,
  onIdTokenChanged,
  signInAnonymously,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth'
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
  type DocumentSnapshot,
} from 'firebase/firestore'
import { getFirebase } from '../lib/firebase'
import type { AccountInfo, UserProfile, WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

export const COLLECTIONS = {
  users: 'users',
  workoutLogs: 'workout_logs',
} as const

const logError = (context: string) => (error: Error) => console.error(`[GymFlow] ${context}`, error)

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : Date.now())

/** Reads a document with pending server timestamps estimated locally instead of `null`. */
function readDoc<T>(snapshot: DocumentSnapshot<DocumentData>): T {
  const data = snapshot.data({ serverTimestamps: 'estimate' }) ?? {}
  return { ...data, id: snapshot.id, createdAt: toMillis(data.createdAt), updatedAt: toMillis(data.updatedAt) } as T
}

function toAccount(user: User): AccountInfo {
  const google = user.providerData.find((provider) => provider.providerId === 'google.com')
  return {
    provider: google ? 'google' : 'anonymous',
    email: google?.email ?? user.email,
    displayName: google?.displayName ?? user.displayName,
    photoURL: google?.photoURL ?? user.photoURL,
  }
}

const errorCode = (error: unknown) => (error as FirebaseError | undefined)?.code ?? ''

export function createFirestoreRepository(): GymflowRepository {
  const { db, auth } = getFirebase()

  let signInPromise: Promise<string> | null = null
  // Linking keeps the uid, so auth listeners don't reliably fire; notify account subscribers manually.
  const accountListeners = new Set<(account: AccountInfo) => void>()
  const notifyAccount = () => {
    if (auth.currentUser) accountListeners.forEach((listener) => listener(toAccount(auth.currentUser!)))
  }

  return {
    mode: 'firebase',

    signIn() {
      // Shared promise: concurrent callers (e.g. React StrictMode running effects twice) must not
      // create two anonymous users, or the app would keep the uid of the one that lost the race.
      signInPromise ??= (async () => {
        await auth.authStateReady()
        const user = auth.currentUser ?? (await signInAnonymously(auth)).user
        return user.uid
      })().catch((error: unknown) => {
        signInPromise = null
        throw error
      })
      return signInPromise
    },

    subscribeAccount(onChange) {
      accountListeners.add(onChange)
      const stop = onIdTokenChanged(auth, (user) => user && onChange(toAccount(user)))
      return () => {
        accountListeners.delete(onChange)
        stop()
      }
    },

    async linkWithGoogle() {
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')
      try {
        await linkWithPopup(user, new GoogleAuthProvider())
        await user.reload()
        notifyAccount()
        return { status: 'linked' }
      } catch (error) {
        const code = errorCode(error)
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return { status: 'cancelled' }
        if (code === 'auth/credential-already-in-use') {
          const credential = GoogleAuthProvider.credentialFromError(error as FirebaseError)
          if (credential) {
            return {
              status: 'account-exists',
              switchAccount: async () => {
                await signInWithCredential(auth, credential)
              },
            }
          }
        }
        throw error
      }
    },

    async signOut() {
      await signOut(auth)
    },

    subscribeProfile(userId, onChange) {
      return onSnapshot(
        doc(db, COLLECTIONS.users, userId),
        (snap) => onChange(snap.exists() ? readDoc<UserProfile>(snap) : null),
        logError('profile'),
      )
    },

    async saveProfile(userId, changes) {
      await setDoc(doc(db, COLLECTIONS.users, userId), { ...changes, updatedAt: serverTimestamp() }, { merge: true })
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
