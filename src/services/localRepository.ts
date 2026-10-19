import { DEFAULT_WEEKLY_GOAL_DAYS, type AuthUser, type UserProfile, type WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

/**
 * Demo mode used when no Firebase config is present. Mirrors the Firestore documents in
 * localStorage so the UI behaves identically. Passwords are not checked; the first login
 * becomes the demo admin, later logins must use an e-mail the admin created.
 */
const KEYS = {
  logs: 'gymflow:workout_logs',
  users: 'gymflow:users',
  session: 'gymflow:session',
} as const

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
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: keep working in memory for this session.
  }
}

/** Demo-mode error with a Firebase-style code, so the UI's error mapping works unchanged. */
const demoError = (code: string) => Object.assign(new Error(code), { code })

const readUsers = () => read<Record<string, UserProfile>>(KEYS.users, {})

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
    if (event.key && Object.values<string>(KEYS).includes(event.key)) notify()
  })

  const saveUser = (user: UserProfile) => {
    write(KEYS.users, { ...readUsers(), [user.id]: user })
    notify()
  }

  return {
    mode: 'local',

    onAuthChange(onChange) {
      return listen(() => onChange(read<AuthUser | null>(KEYS.session, null)))
    },

    async signInWithEmail(email) {
      const normalized = email.trim().toLowerCase()
      const users = Object.values(readUsers())
      let user = users.find((candidate) => candidate.email === normalized)
      if (!user && users.length === 0) {
        const now = Date.now()
        user = {
          id: `demo-${crypto.randomUUID()}`,
          email: normalized,
          displayName: normalized.split('@')[0],
          role: 'admin',
          status: 'active',
          weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
          createdAt: now,
          createdBy: null,
          updatedAt: now,
          lastLoginAt: null,
        }
        saveUser(user)
      }
      if (!user) throw demoError('auth/invalid-credential')
      write(KEYS.session, { uid: user.id, email: user.email } satisfies AuthUser)
      notify()
    },

    async signOut() {
      write(KEYS.session, null)
      notify()
    },

    async sendPasswordReset() {},

    subscribeProfile(userId, onChange) {
      return listen(() => onChange(readUsers()[userId] ?? null))
    },

    async saveProfile(userId, changes) {
      const user = readUsers()[userId]
      if (user) saveUser({ ...user, ...changes, updatedAt: Date.now() })
    },

    async recordLogin(userId) {
      const user = readUsers()[userId]
      if (user) saveUser({ ...user, lastLoginAt: Date.now() })
    },

    subscribeUsers(onChange) {
      return listen(() => onChange(Object.values(readUsers()).sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'))))
    },

    async createUser(input, adminId) {
      const email = input.email.trim().toLowerCase()
      if (Object.values(readUsers()).some((user) => user.email === email)) throw demoError('auth/email-already-in-use')
      const now = Date.now()
      const user: UserProfile = {
        id: `demo-${crypto.randomUUID()}`,
        email,
        displayName: input.displayName.trim(),
        role: input.role,
        status: 'active',
        weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
        createdAt: now,
        createdBy: adminId,
        updatedAt: now,
        lastLoginAt: null,
      }
      saveUser(user)
      return user
    },

    async updateUser(userId, changes) {
      const user = readUsers()[userId]
      if (user) saveUser({ ...user, ...changes, updatedAt: Date.now() })
    },

    async deleteUser(userId) {
      const users = readUsers()
      delete users[userId]
      write(KEYS.users, users)
      const logs = read<Record<string, WorkoutLog>>(KEYS.logs, {})
      for (const key of Object.keys(logs)) if (key.startsWith(`${userId}/`)) delete logs[key]
      write(KEYS.logs, logs)
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
