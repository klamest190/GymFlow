// Security rules tests against the local Firestore emulator.
// Run with: npm run test:rules   (needs the Firebase CLI and Java 21+ on PATH)
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
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

const progress = (overrides) => ({
  currentXP: 1200,
  totalXP: 1700,
  level: 2,
  rank: 'iron',
  unlockedAchievements: { 'iron-will': '2026-10-19' },
  ...overrides,
})

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
    await setDoc(doc(db, 'users', USER), account({ email: 'user@example.com', username: 'user1' }))
    await setDoc(doc(db, 'usernames', 'user1'), { uid: USER, email: 'user@example.com' })
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
  test('updates own dumbbell weight', () => assertSucceeds(updateDoc(doc(as(USER), 'users', USER), { dumbbellKg: 7.5, updatedAt: serverTimestamp() })))
  test('rejects an implausible dumbbell weight', async () => {
    await assertFails(updateDoc(doc(as(USER), 'users', USER), { dumbbellKg: 0 }))
    await assertFails(updateDoc(doc(as(USER), 'users', USER), { dumbbellKg: 80 }))
    await assertFails(updateDoc(doc(as(USER), 'users', USER), { dumbbellKg: '5' }))
  })
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
  test('cannot change own dumbbell weight', () => assertFails(updateDoc(doc(as(DISABLED), 'users', DISABLED), { dumbbellKg: 6 })))
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

describe('gamification (XP, level, rank, achievements)', () => {
  const own = () => doc(as(USER), 'users', USER)
  test('user syncs own progress', () => assertSucceeds(updateDoc(own(), progress({}))))
  test('user syncs progress again (level-up)', async () => {
    await assertSucceeds(updateDoc(own(), progress({})))
    await assertSucceeds(updateDoc(own(), progress({ currentXP: 86, totalXP: 2000, level: 3 })))
  })
  test('admin syncs own progress', () => assertSucceeds(updateDoc(doc(as(ADMIN), 'users', ADMIN), progress({}))))
  test('rejects an incomplete first sync', () => assertFails(updateDoc(own(), { totalXP: 100 })))
  test('rejects negative XP', () => assertFails(updateDoc(own(), progress({ totalXP: -1, currentXP: 0 }))))
  test('rejects more level XP than total XP', () => assertFails(updateDoc(own(), progress({ currentXP: 5000 }))))
  test('rejects fractional XP', () => assertFails(updateDoc(own(), progress({ totalXP: 1700.5 }))))
  test('rejects level 0', () => assertFails(updateDoc(own(), progress({ level: 0 }))))
  test('rejects an unknown rank', () => assertFails(updateDoc(own(), progress({ rank: 'legend' }))))
  test('rejects achievements that are not a map', () => assertFails(updateDoc(own(), progress({ unlockedAchievements: ['iron-will'] }))))
  test('cannot write another user’s progress', () => assertFails(updateDoc(doc(as(USER), 'users', OTHER), progress({}))))
  test('admin cannot write a user’s progress', () => assertFails(updateDoc(doc(as(ADMIN), 'users', USER), progress({}))))
  test('disabled user cannot sync progress', () => assertFails(updateDoc(doc(as(DISABLED), 'users', DISABLED), progress({}))))
  test('admin still manages an account that has progress', async () => {
    await assertSucceeds(updateDoc(own(), progress({})))
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'users', USER), { displayName: 'Mit Level', updatedAt: serverTimestamp() }))
  })
  test('admin may create an account with initial progress', () =>
    assertSucceeds(setDoc(doc(as(ADMIN), 'users', 'new-uid'), account({ ...progress({ currentXP: 0, totalXP: 0, level: 1, unlockedAchievements: {} }) }))))
})

describe('usernames (login by username)', () => {
  const NEW = 'new-uid'
  /** What the app writes when an admin creates an account with a username. */
  const createWithUsername = (db, username, mapping = {}) => {
    const batch = writeBatch(db)
    batch.set(doc(db, 'users', NEW), account({ email: 'new@example.com', username }))
    batch.set(doc(db, 'usernames', username), { uid: NEW, email: 'new@example.com', ...mapping })
    return batch.commit()
  }
  /** What the app writes when an admin renames a username. */
  const rename = (db, uid, from, to, email) => {
    const batch = writeBatch(db)
    if (from) batch.delete(doc(db, 'usernames', from))
    batch.set(doc(db, 'usernames', to), { uid, email })
    batch.update(doc(db, 'users', uid), { username: to, updatedAt: serverTimestamp() })
    return batch.commit()
  }

  test('signed out can resolve a single username (needed before sign-in)', () => assertSucceeds(getDoc(doc(anon(), 'usernames', 'user1'))))
  test('signed out cannot list usernames', () => assertFails(getDocs(collection(anon(), 'usernames'))))
  test('active user cannot list usernames', () => assertFails(getDocs(collection(as(USER), 'usernames'))))

  test('admin creates an account with username', () => assertSucceeds(createWithUsername(as(ADMIN), 'anna.schneider')))
  test('rejects a username that is already taken', () => assertFails(createWithUsername(as(ADMIN), 'user1')))
  test('rejects an invalid username', () => assertFails(createWithUsername(as(ADMIN), 'Anna Schneider')))
  test('rejects a too short username', () => assertFails(createWithUsername(as(ADMIN), 'ab')))
  test('rejects a mapping with the wrong e-mail', () => assertFails(createWithUsername(as(ADMIN), 'anna', { email: 'evil@example.com' })))
  test('rejects an account whose username is not reserved', () =>
    assertFails(setDoc(doc(as(ADMIN), 'users', NEW), account({ email: 'new@example.com', username: 'ghost' }))))
  test('rejects a mapping without matching account', () =>
    assertFails(setDoc(doc(as(ADMIN), 'usernames', 'ghost'), { uid: OTHER, email: 'x@example.com' })))
  test('user cannot reserve a username', () => assertFails(setDoc(doc(as(USER), 'usernames', 'mine'), { uid: USER, email: 'user@example.com' })))
  test('cannot overwrite an existing mapping', () =>
    assertFails(setDoc(doc(as(ADMIN), 'usernames', 'user1'), { uid: OTHER, email: 'x@example.com' })))

  test('admin renames a user', () => assertSucceeds(rename(as(ADMIN), USER, 'user1', 'user.neu', 'user@example.com')))
  test('admin gives an old account its first username', () => assertSucceeds(rename(as(ADMIN), OTHER, null, 'other', 'x@example.com')))
  test('admin sets own username', () => assertSucceeds(rename(as(ADMIN), ADMIN, null, 'chef', 'x@example.com')))
  test('user cannot rename itself', () => assertFails(rename(as(USER), USER, 'user1', 'user.neu', 'user@example.com')))
  test('cannot rename to a taken username', () => assertFails(rename(as(ADMIN), OTHER, null, 'user1', 'x@example.com')))
  test('cannot release a username that is still in use', () => assertFails(deleteDoc(doc(as(ADMIN), 'usernames', 'user1'))))
  test('admin deletes an account together with its username', async () => {
    const db = as(ADMIN)
    await assertSucceeds(deleteDoc(doc(db, 'users', USER, 'workout_logs', '2026-10-19')))
    const batch = writeBatch(db)
    batch.delete(doc(db, 'usernames', 'user1'))
    batch.delete(doc(db, 'users', USER))
    await assertSucceeds(batch.commit())
  })
  test('user with username still updates own goal and progress', async () => {
    await assertSucceeds(updateDoc(doc(as(USER), 'users', USER), { weeklyGoalDays: 4, updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(as(USER), 'users', USER), progress({})))
  })
  test('admin still renames the display name of a user with username', () =>
    assertSucceeds(updateDoc(doc(as(ADMIN), 'users', USER), { displayName: 'Neu', updatedAt: serverTimestamp() })))
})

describe('onboarding (first-run tour, shown until completed)', () => {
  const own = () => doc(as(USER), 'users', USER)
  test('user completes the tour with the server time', () => assertSucceeds(updateDoc(own(), { onboardingCompletedAt: serverTimestamp() })))
  test('user cannot backdate or invent the completion time', () =>
    assertFails(updateDoc(own(), { onboardingCompletedAt: new Date('2020-01-01') })))
  test('user cannot reset a completed tour', async () => {
    await assertSucceeds(updateDoc(own(), { onboardingCompletedAt: serverTimestamp() }))
    await assertFails(updateDoc(own(), { onboardingCompletedAt: null }))
  })
  test('user cannot overwrite a completed tour', async () => {
    await assertSucceeds(updateDoc(own(), { onboardingCompletedAt: serverTimestamp() }))
    await assertFails(updateDoc(own(), { onboardingCompletedAt: serverTimestamp() }))
  })
  test('completed tour does not block other own updates', async () => {
    await assertSucceeds(updateDoc(own(), { onboardingCompletedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(own(), { weeklyGoalDays: 5, updatedAt: serverTimestamp() }))
  })
  test('goal and tour can be saved together', () =>
    assertSucceeds(updateDoc(own(), { weeklyGoalDays: 4, onboardingCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() })))
  test('admin cannot complete the tour for someone else', () =>
    assertFails(updateDoc(doc(as(ADMIN), 'users', USER), { onboardingCompletedAt: serverTimestamp() })))
  test('disabled user cannot complete the tour', () =>
    assertFails(updateDoc(doc(as(DISABLED), 'users', DISABLED), { onboardingCompletedAt: serverTimestamp() })))
  test('admin still manages an account with a completed tour', async () => {
    await assertSucceeds(updateDoc(own(), { onboardingCompletedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'users', USER), { status: 'disabled', updatedAt: serverTimestamp() }))
  })
})

describe('workout templates', () => {
  const template = (overrides = {}) => ({
    name: 'Push',
    exercises: [{ exerciseId: 'squats', sets: [{ reps: 8, weightKg: 60 }] }],
    createdAt: serverTimestamp(),
    ...overrides,
  })
  const own = (db) => doc(db, 'users', USER, 'templates', 't1')
  test('user saves own template', () => assertSucceeds(setDoc(own(as(USER)), template())))
  test('user reads and deletes own templates', async () => {
    await assertSucceeds(setDoc(own(as(USER)), template()))
    await assertSucceeds(getDocs(collection(as(USER), 'users', USER, 'templates')))
    await assertSucceeds(deleteDoc(own(as(USER))))
  })
  test('rejects an empty name', () => assertFails(setDoc(own(as(USER)), template({ name: '' }))))
  test('rejects a template without exercises', () => assertFails(setDoc(own(as(USER)), template({ exercises: [] }))))
  test('rejects unknown fields', () => assertFails(setDoc(own(as(USER)), template({ shared: true }))))
  test('cannot write another user’s templates', () => assertFails(setDoc(doc(as(USER), 'users', OTHER, 'templates', 't1'), template())))
  test('cannot read another user’s templates', () => assertFails(getDocs(collection(as(USER), 'users', OTHER, 'templates'))))
  test('disabled user cannot save templates', () => assertFails(setDoc(doc(as(DISABLED), 'users', DISABLED, 'templates', 't1'), template())))
  test('admin can read but not write a user’s templates', async () => {
    await assertSucceeds(getDocs(collection(as(ADMIN), 'users', USER, 'templates')))
    await assertFails(setDoc(own(as(ADMIN)), template()))
  })
})

describe('body weights', () => {
  const weighIn = (date, weightKg = 82.4) => ({ date, weightKg, updatedAt: serverTimestamp() })
  const own = (db, date = '2026-10-24') => doc(db, 'users', USER, 'body_weights', date)
  test('user logs today’s weight', () => assertSucceeds(setDoc(own(as(USER)), weighIn('2026-10-24'))))
  test('user overwrites and deletes a weigh-in', async () => {
    await assertSucceeds(setDoc(own(as(USER)), weighIn('2026-10-24')))
    await assertSucceeds(setDoc(own(as(USER)), weighIn('2026-10-24', 81.9)))
    await assertSucceeds(deleteDoc(own(as(USER))))
  })
  test('rejects a date that does not match the ID', () => assertFails(setDoc(own(as(USER)), weighIn('2026-10-23'))))
  test('rejects implausible weights', async () => {
    await assertFails(setDoc(own(as(USER)), weighIn('2026-10-24', 5)))
    await assertFails(setDoc(own(as(USER)), weighIn('2026-10-24', 900)))
    await assertFails(setDoc(own(as(USER)), weighIn('2026-10-24', '82')))
  })
  test('cannot read another user’s weights', () => assertFails(getDocs(collection(as(USER), 'users', OTHER, 'body_weights'))))
  test('disabled user cannot log weight', () => assertFails(setDoc(doc(as(DISABLED), 'users', DISABLED, 'body_weights', '2026-10-24'), weighIn('2026-10-24'))))
  test('admin deletes a user’s weights (account deletion), but never writes them', async () => {
    await env.withSecurityRulesDisabled((context) => setDoc(own(context.firestore()), weighIn('2026-10-24')))
    await assertFails(setDoc(own(as(ADMIN), '2026-10-25'), weighIn('2026-10-25')))
    await assertSucceeds(deleteDoc(own(as(ADMIN))))
  })
})
