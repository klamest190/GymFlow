import { isEmailLogin, normalizeUsername } from '../lib/usernames'
import {
  DEFAULT_WEEKLY_GOAL_DAYS,
  type AuthUser,
  type BodyWeightEntry,
  type UserProfile,
  type WorkoutLog,
  type WorkoutTemplate,
} from '../types/models'
import type { GymflowRepository } from './repository'

/**
 * Demo mode used when no Firebase config is present. Mirrors the Firestore documents in
 * localStorage so the UI behaves identically. Passwords are not checked; the first login
 * becomes the demo admin, later logins must use an e-mail or username the admin created.
 */
const KEYS = {
  logs: 'gymflow:workout_logs',
  users: 'gymflow:users',
  session: 'gymflow:session',
  templates: 'gymflow:templates',
  bodyWeights: 'gymflow:body_weights',
} as const

/** Per-user records stored as `{ "<userId>/<id>": value }`, like the logs. */
type UserScoped<T> = Record<string, T>
const ownedBy = (userId: string, key: string) => key.startsWith(`${userId}/`)

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

/** Finds an account by e-mail or username (demo data from before usernames has none). */
const findUser = (login: string) => {
  const value = login.trim().toLowerCase()
  return Object.values(readUsers()).find((user) => (isEmailLogin(value) ? user.email === value : user.username === value))
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

    async signIn(login) {
      const normalized = login.trim().toLowerCase()
      let user = findUser(normalized)
      if (!user && Object.keys(readUsers()).length === 0) {
        const now = Date.now()
        const email = isEmailLogin(normalized) ? normalized : `${normalized}@demo.local`
        user = {
          id: `demo-${crypto.randomUUID()}`,
          email,
          username: isEmailLogin(normalized) ? null : normalized,
          displayName: email.split('@')[0],
          role: 'admin',
          status: 'active',
          weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
          createdAt: now,
          createdBy: null,
          updatedAt: now,
          lastLoginAt: null,
          onboardingCompletedAt: null,
          gamification: null,
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

    async completeOnboarding(userId) {
      const user = readUsers()[userId]
      if (user && !user.onboardingCompletedAt) saveUser({ ...user, onboardingCompletedAt: Date.now() })
    },

    async saveGamification(userId, state) {
      const user = readUsers()[userId]
      if (user) saveUser({ ...user, gamification: state })
    },

    subscribeUsers(onChange) {
      return listen(() => onChange(Object.values(readUsers()).sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'))))
    },

    async createUser(input, adminId) {
      const email = input.email.trim().toLowerCase()
      const username = normalizeUsername(input.username)
      if (findUser(email)) throw demoError('auth/email-already-in-use')
      if (findUser(username)) throw demoError('username-taken')
      const now = Date.now()
      const user: UserProfile = {
        id: `demo-${crypto.randomUUID()}`,
        email,
        username,
        displayName: input.displayName.trim(),
        role: input.role,
        status: 'active',
        weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
        createdAt: now,
        createdBy: adminId,
        updatedAt: now,
        lastLoginAt: null,
        onboardingCompletedAt: null,
        gamification: null,
      }
      saveUser(user)
      return user
    },

    async updateUser(userId, changes) {
      const user = readUsers()[userId]
      if (user) saveUser({ ...user, ...changes, updatedAt: Date.now() })
    },

    async setUsername(user, username) {
      const next = normalizeUsername(username)
      if (next === user.username) return
      if (findUser(next)) throw demoError('username-taken')
      const stored = readUsers()[user.id]
      if (stored) saveUser({ ...stored, username: next, updatedAt: Date.now() })
    },

    async deleteUser(userId) {
      const users = readUsers()
      delete users[userId]
      write(KEYS.users, users)
      for (const storageKey of [KEYS.logs, KEYS.templates, KEYS.bodyWeights]) {
        const records = read<UserScoped<unknown>>(storageKey, {})
        for (const key of Object.keys(records)) if (ownedBy(userId, key)) delete records[key]
        write(storageKey, records)
      }
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

    subscribeTemplates(userId, onChange) {
      return listen(() => {
        const templates = Object.entries(read<UserScoped<WorkoutTemplate>>(KEYS.templates, {}))
          .filter(([key]) => ownedBy(userId, key))
          .map(([, template]) => template)
        onChange(templates.sort((a, b) => b.createdAt - a.createdAt))
      })
    },

    async saveTemplate(userId, template) {
      const id = crypto.randomUUID()
      const templates = read<UserScoped<WorkoutTemplate>>(KEYS.templates, {})
      templates[`${userId}/${id}`] = { id, name: template.name, exercises: template.exercises, createdAt: Date.now() }
      write(KEYS.templates, templates)
      notify()
    },

    async deleteTemplate(userId, templateId) {
      const templates = read<UserScoped<WorkoutTemplate>>(KEYS.templates, {})
      delete templates[`${userId}/${templateId}`]
      write(KEYS.templates, templates)
      notify()
    },

    subscribeBodyWeights(userId, onChange) {
      return listen(() => {
        const entries = Object.entries(read<UserScoped<BodyWeightEntry>>(KEYS.bodyWeights, {}))
          .filter(([key]) => ownedBy(userId, key))
          .map(([, entry]) => entry)
        onChange(entries.sort((a, b) => a.date.localeCompare(b.date)))
      })
    },

    async saveBodyWeight(userId, date, weightKg) {
      const entries = read<UserScoped<BodyWeightEntry>>(KEYS.bodyWeights, {})
      entries[`${userId}/${date}`] = { date, weightKg, updatedAt: Date.now() }
      write(KEYS.bodyWeights, entries)
      notify()
    },

    async deleteBodyWeight(userId, date) {
      const entries = read<UserScoped<BodyWeightEntry>>(KEYS.bodyWeights, {})
      delete entries[`${userId}/${date}`]
      write(KEYS.bodyWeights, entries)
      notify()
    },
  }
}
