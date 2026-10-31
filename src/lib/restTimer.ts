/**
 * Rest timer between sets. Only the start time and duration are kept (in localStorage), so the
 * countdown stays right across tab switches, reloads and a locked screen.
 */
export interface RestState {
  startedAt: number
  durationMs: number
  /** "Pause nach Satz 2, Kurzhantel-Curls" */
  label: string
}

export const REST_STEP_SECONDS = 15
export const MIN_REST_SECONDS = 30
export const MAX_REST_SECONDS = 300
export const DEFAULT_REST_SECONDS = 90

/** Milliseconds left; negative once the rest is over (the overtime). */
export const restRemainingMs = (rest: RestState, now: number) => rest.startedAt + rest.durationMs - now

export const adjustRest = (rest: RestState, deltaMs: number): RestState => ({ ...rest, durationMs: Math.max(0, rest.durationMs + deltaMs) })

/** "1:12" while counting down (rounded up, so 0:00 means over), "+0:12" for the overtime. */
export function formatRestClock(remainingMs: number): string {
  const overtime = remainingMs < 0
  const seconds = overtime ? Math.floor(-remainingMs / 1000) : Math.ceil(remainingMs / 1000)
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  return overtime ? `+${clock}` : clock
}

/** The rest setting: 30 s to 5 min in 15 s steps. */
export function clampRestSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_REST_SECONDS
  const stepped = Math.ceil(seconds / REST_STEP_SECONDS) * REST_STEP_SECONDS
  return Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, stepped))
}

export function parseRestState(stored: string | null): RestState | null {
  if (!stored) return null
  try {
    const value = JSON.parse(stored) as Partial<RestState>
    if (typeof value.startedAt !== 'number' || typeof value.durationMs !== 'number' || typeof value.label !== 'string') return null
    return { startedAt: value.startedAt, durationMs: value.durationMs, label: value.label }
  } catch {
    return null
  }
}
