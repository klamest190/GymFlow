import type { AccountInfo, UserProfile, WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

/**
 * Demo mode used when no Firebase config is present. Mirrors the Firestore
 * documents in localStorage so the UI behaves identically.
 */
const KEYS = {
  logs: 'gymflow:workout_logs',
  profile: 'gymflow:profile',
} as const

const LOCAL_USER_ID = 'local-user'
const LOCAL_ACCOUNT: AccountInfo = { provider: 'local', email: null, displayName: null, photoURL: null }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
}

export function createLocalRepository(): GymflowRepository {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const listen = (listener: () => void) => {
    listeners.add(listener)
    listener()
    return () => void listeners.delete(listener)
  }
  // Keep multiple tabs in sync.
  window.addEventListener('storage', (event) => {
    if (event.key === KEYS.logs || event.key === KEYS.profile) notify()
  })

  return {
    mode: 'local',

    signIn: async () => LOCAL_USER_ID,

    subscribeAccount(onChange) {
      onChange(LOCAL_ACCOUNT)
      return () => {}
    },

    async linkWithGoogle() {
      throw new Error('Google sign-in needs the Firebase config (.env.local).')
    },

    async signOut() {},

    subscribeProfile(_userId, onChange) {
      return listen(() => onChange(read<UserProfile | null>(KEYS.profile, null)))
    },

    async saveProfile(_userId, changes) {
      write(KEYS.profile, { ...read<UserProfile | null>(KEYS.profile, null), ...changes, updatedAt: Date.now() })
      notify()
    },

    subscribeLogs(userId, from, to, onChange) {
      return listen(() => {
        const logs = Object.values(read<Record<string, WorkoutLog>>(KEYS.logs, {})).filter(
          (log) => log.userId === userId && log.date >= from && log.date <= to,
        )
        onChange(logs)
      })
    },

    async saveLog(log) {
      const logs = read<Record<string, WorkoutLog>>(KEYS.logs, {})
      const key = `${log.userId}/${log.id}`
      if (log.entries.length === 0) delete logs[key]
      else logs[key] = log
      write(KEYS.logs, logs)
      notify()
    },
  }
}
