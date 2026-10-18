import type { WorkoutLog } from '../types/models'
import type { GymflowRepository } from './repository'

/**
 * Demo mode used when no Firebase config is present. Mirrors the Firestore
 * workout logs in localStorage so the UI behaves identically.
 */
const LOGS_KEY = 'gymflow:workout_logs'

const LOCAL_USER_ID = 'local-user'

function readLogs(): Record<string, WorkoutLog> {
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) ?? '{}') as Record<string, WorkoutLog>
  } catch {
    return {}
  }
}

function writeLogs(logs: Record<string, WorkoutLog>) {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
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
    if (event.key === LOGS_KEY) notify()
  })

  return {
    mode: 'local',

    signIn: async () => LOCAL_USER_ID,

    subscribeLogs(userId, from, to, onChange) {
      return listen(() => {
        const logs = Object.values(readLogs()).filter((log) => log.userId === userId && log.date >= from && log.date <= to)
        onChange(logs)
      })
    },

    async saveLog(log) {
      const logs = readLogs()
      const key = `${log.userId}/${log.id}`
      if (log.entries.length === 0) delete logs[key]
      else logs[key] = log
      writeLogs(logs)
      notify()
    },
  }
}
