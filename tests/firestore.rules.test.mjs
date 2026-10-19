// Security rules tests against the local Firestore emulator.
// Run with: npm run test:rules   (needs the Firebase CLI and Java 21+ on PATH)
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, test } from 'node:test'

const ADMIN = 'admin-uid'
const USER = 'user-uid'
const OTHER = 'other-uid'
const DISABLED = 'disabled-uid'
const DISABLED_ADMIN = 'disabled-admin-uid'
const STRANGER = 'self-registered-uid' // has a login, but no account document

const account = (overrides) => ({
  email: 'x@example.com',
  displayName: 'Test',
  role: 'user',
  status: 'active',
  weeklyGoalDays: 3,
  createdAt: new Date(),
  createdBy: ADMIN,
  updatedAt: new Date(),
  lastLoginAt: null,
  ...overrides,
})

const log = (userId, date) => ({ userId, date, entries: [], totals: { exercises: 0, sets: 0, reps: 0, volumeKg: 0 }, muscleGroupReps: {} })

let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-gymflow',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

after(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users', ADMIN), account({ role: 'admin', createdBy: null }))
    await setDoc(doc(db, 'users', USER), account({}))
    await setDoc(doc(db, 'users', OTHER), account({}))
    await setDoc(doc(db, 'users', DISABLED), account({ status: 'disabled' }))
    await setDoc(doc(db, 'users', DISABLED_ADMIN), account({ role: 'admin', status: 'disabled' }))
    await setDoc(doc(db, 'users', USER, 'workout_logs', '2026-10-19'), log(USER, '2026-10-19'))
    await setDoc(doc(db, 'users', DISABLED, 'workout_logs', '2026-10-19'), log(DISABLED, '2026-10-19'))
  })
})

const as = (uid) => env.authenticatedContext(uid).firestore()
const anon = () => env.unauthenticatedContext().firestore()

describe('signed out', () => {
  test('cannot read any account', () => assertFails(getDoc(doc(anon(), 'users', USER))))
  test('cannot list accounts', () => assertFails(getDocs(collection(anon(), 'users'))))
})

describe('login without account document (self-registered via the public Auth API)', () => {
  test('cannot create its own account document', () => assertFails(setDoc(doc(as(STRANGER), 'users', STRANGER), account({ createdBy: STRANGER }))))
  test('cannot make itself admin', () => assertFails(setDoc(doc(as(STRANGER), 'users', STRANGER), account({ role: 'admin', createdBy: STRANGER }))))
  test('cannot write workout logs', () => assertFails(setDoc(doc(as(STRANGER), 'users', STRANGER, 'workout_logs', '2026-10-19'), log(STRANGER, '2026-10-19'))))
  test('cannot list accounts', () => assertFails(getDocs(collection(as(STRANGER), 'users'))))
  test('may read its own (missing) document, so the app can explain', () => assertSucceeds(getDoc(doc(as(STRANGER), 'users', STRANGER))))
})

describe('active user', () => {
  test('reads own account', () => assertSucceeds(getDoc(doc(as(USER), 'users', USER))))
  test('cannot read another account', () => assertFails(getDoc(doc(as(USER), 'users', OTHER))))
  test('cannot list accounts', () => assertFails(getDocs(collection(as(USER), 'users'))))
  test('updates own weekly goal', () => assertSucceeds(updateDoc(doc(as(USER), 'users', USER), { weeklyGoalDays: 5, updatedAt: serverTimestamp() })))
  test('records own login', () => assertSucceeds(updateDoc(doc(as(USER), 'users', USER), { lastLoginAt: serverTimestamp() })))
  test('rejects an invalid weekly goal', () => assertFails(updateDoc(doc(as(USER), 'users', USER), { weeklyGoalDays: 9 })))
  test('rejects a fractional weekly goal', () => assertFails(updateDoc(doc(as(USER), 'users', USER), { weeklyGoalDays: 2.5 })))
  test('cannot promote itself to admin', () => assertFails(updateDoc(doc(as(USER), 'users', USER), { role: 'admin' })))
  test('cannot change own status', () => assertFails(updateDoc(doc(as(USER), 'users', USER), { status: 'disabled' })))
  test('cannot rename itself (admin-managed)', () => assertFails(updateDoc(doc(as(USER), 'users', USER), { displayName: 'Hacker' })))
  test('cannot delete own account', () => assertFails(deleteDoc(doc(as(USER), 'users', USER))))
  test('reads own logs', () => assertSucceeds(getDocs(collection(as(USER), 'users', USER, 'workout_logs'))))
  test('writes own log', () => assertSucceeds(setDoc(doc(as(USER), 'users', USER, 'workout_logs', '2026-10-18'), log(USER, '2026-10-18'))))
  test('deletes own log', () => assertSucceeds(deleteDoc(doc(as(USER), 'users', USER, 'workout_logs', '2026-10-19'))))
  test('rejects a log whose date does not match its ID', () =>
    assertFails(setDoc(doc(as(USER), 'users', USER, 'workout_logs', '2026-10-18'), log(USER, '2026-10-17'))))
  test('cannot read another user’s logs', () => assertFails(getDocs(collection(as(USER), 'users', OTHER, 'workout_logs'))))
  test('cannot write another user’s logs', () =>
    assertFails(setDoc(doc(as(USER), 'users', OTHER, 'workout_logs', '2026-10-19'), log(OTHER, '2026-10-19'))))
})

describe('disabled user', () => {
  test('still reads own account (to see why)', () => assertSucceeds(getDoc(doc(as(DISABLED), 'users', DISABLED))))
  test('cannot read own logs', () => assertFails(getDocs(collection(as(DISABLED), 'users', DISABLED, 'workout_logs'))))
  test('cannot write own logs', () =>
    assertFails(setDoc(doc(as(DISABLED), 'users', DISABLED, 'workout_logs', '2026-10-18'), log(DISABLED, '2026-10-18'))))
  test('cannot change own weekly goal', () => assertFails(updateDoc(doc(as(DISABLED), 'users', DISABLED), { weeklyGoalDays: 4 })))
  test('cannot reactivate itself', () => assertFails(updateDoc(doc(as(DISABLED), 'users', DISABLED), { status: 'active' })))
})

describe('admin', () => {
  test('lists all accounts', () => assertSucceeds(getDocs(collection(as(ADMIN), 'users'))))
  test('creates an account', () =>
    assertSucceeds(setDoc(doc(as(ADMIN), 'users', 'new-uid'), account({ createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))))
  test('cannot create an account attributed to someone else', () =>
    assertFails(setDoc(doc(as(ADMIN), 'users', 'new-uid'), account({ createdBy: OTHER }))))
  test('cannot create a pre-disabled or malformed account', () =>
    assertFails(setDoc(doc(as(ADMIN), 'users', 'new-uid'), account({ status: 'disabled' }))))
  test('rejects unknown fields', () => assertFails(setDoc(doc(as(ADMIN), 'users', 'new-uid'), account({ isSuperUser: true }))))
  test('promotes a user to admin', () => assertSucceeds(updateDoc(doc(as(ADMIN), 'users', USER), { role: 'admin', updatedAt: serverTimestamp() })))
  test('disables a user', () => assertSucceeds(updateDoc(doc(as(ADMIN), 'users', USER), { status: 'disabled', updatedAt: serverTimestamp() })))
  test('renames a user', () => assertSucceeds(updateDoc(doc(as(ADMIN), 'users', USER), { displayName: 'Neuer Name' })))
  test('cannot change a user’s weekly goal or e-mail', () => assertFails(updateDoc(doc(as(ADMIN), 'users', USER), { email: 'evil@example.com' })))
  test('cannot demote itself', () => assertFails(updateDoc(doc(as(ADMIN), 'users', ADMIN), { role: 'user' })))
  test('cannot disable itself', () => assertFails(updateDoc(doc(as(ADMIN), 'users', ADMIN), { status: 'disabled' })))
  test('renames itself', () => assertSucceeds(updateDoc(doc(as(ADMIN), 'users', ADMIN), { displayName: 'Chef' })))
  test('deletes another account', () => assertSucceeds(deleteDoc(doc(as(ADMIN), 'users', USER))))
  test('cannot delete itself', () => assertFails(deleteDoc(doc(as(ADMIN), 'users', ADMIN))))
  test('reads a user’s logs (for full deletion)', () => assertSucceeds(getDocs(collection(as(ADMIN), 'users', USER, 'workout_logs'))))
  test('deletes a user’s logs', () => assertSucceeds(deleteDoc(doc(as(ADMIN), 'users', USER, 'workout_logs', '2026-10-19'))))
  test('cannot write a user’s logs', () =>
    assertFails(setDoc(doc(as(ADMIN), 'users', USER, 'workout_logs', '2026-10-18'), log(USER, '2026-10-18'))))
})

describe('disabled admin', () => {
  test('loses all admin rights', () => assertFails(getDocs(collection(as(DISABLED_ADMIN), 'users'))))
  test('cannot create accounts', () => assertFails(setDoc(doc(as(DISABLED_ADMIN), 'users', 'new-uid'), account({ createdBy: DISABLED_ADMIN }))))
})
