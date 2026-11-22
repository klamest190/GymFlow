import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GUEST_UID } from '../data/guest'
import type { AuthUser, WorkoutLog } from '../types/models'

// The demo store as the primary one, whatever .env holds.
vi.mock('../lib/firebase', () => ({ isFirebaseConfigured: false }))
vi.mock('./firestoreRepository', () => ({ createFirestoreRepository: () => ({}) }))

/** In-memory localStorage and the bits of window the local stores touch. */
function stubBrowser() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  })
  vi.stubGlobal('window', { addEventListener: () => {} })
  return store
}

const log = (userId: string): WorkoutLog => ({
  id: '2026-11-22',
  userId,
  date: '2026-11-22',
  entries: [{ id: 'e1', exerciseId: 'bicep-curls', exerciseName: 'Bizeps-Curls', primaryMuscle: 'biceps', usesWeight: true, position: 0, sets: [] }],
  totals: { sets: 0, reps: 0, volumeKg: 0 },
  createdAt: 0,
  updatedAt: 0,
}) as unknown as WorkoutLog

async function freshRepository() {
  vi.resetModules()
  const { repository } = await import('./repository')
  const users: (AuthUser | null)[] = []
  repository.onAuthChange((user) => users.push(user))
  return { repository, users }
}

describe('guest mode routing', () => {
  let store: Map<string, string>
  beforeEach(() => {
    store = stubBrowser()
  })

  it('starts a guest session that stays out of the account stores', async () => {
    const { repository, users } = await freshRepository()
    expect(users).toEqual([null])

    repository.startGuest()
    expect(users.at(-1)?.uid).toBe(GUEST_UID)

    await repository.saveLog(log(GUEST_UID))
    expect(store.get('gymflow-guest:workout_logs')).toContain('bicep-curls')
    expect(store.has('gymflow:workout_logs')).toBe(false)

    const profiles: unknown[] = []
    repository.subscribeProfile(GUEST_UID, (profile) => profiles.push(profile), () => {})
    expect(profiles.at(-1)).toMatchObject({ id: GUEST_UID, role: 'user', status: 'active' })
  })

  it('reports each identity once, not on every write', async () => {
    const { repository, users } = await freshRepository()
    repository.startGuest()
    await repository.saveLog(log(GUEST_UID))
    await repository.saveProfile(GUEST_UID, { weeklyGoalDays: 4 })
    expect(users.map((user) => user?.uid ?? null)).toEqual([null, GUEST_UID])
  })

  it('keeps the guest data after leaving and deletes it on reset', async () => {
    const { repository, users } = await freshRepository()
    repository.startGuest()
    await repository.saveLog(log(GUEST_UID))

    await repository.signOut()
    expect(users.at(-1)).toBeNull()
    expect(store.get('gymflow-guest:workout_logs')).toContain('bicep-curls')

    repository.startGuest()
    const logs: WorkoutLog[][] = []
    repository.subscribeLogs(GUEST_UID, '2026-11-01', '2026-11-30', (next) => logs.push(next))
    expect(logs.at(-1)).toHaveLength(1)

    repository.resetGuest()
    expect(users.at(-1)).toBeNull()
    expect([...store.keys()].some((key) => key.startsWith('gymflow-guest:'))).toBe(false)
  })

  it('lets a real sign-in replace the guest session', async () => {
    const { repository, users } = await freshRepository()
    repository.startGuest()
    await repository.signIn('admin', 'egal')
    expect(users.at(-1)?.uid).toMatch(/^demo-/)

    // Signing out of the account must not fall back into the guest session.
    await repository.signOut()
    expect(users.at(-1)).toBeNull()
  })
})
