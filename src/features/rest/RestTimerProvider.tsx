import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  adjustRest,
  clampRestSeconds,
  DEFAULT_REST_SECONDS,
  parseRestState,
  restRemainingMs,
  type RestState,
} from '../../lib/restTimer'
import { playRestOver, unlockAudio } from '../../lib/sound'
import { RestTimerContext, type RestTimerValue } from './restTimerContext'

const REST_KEY = 'gymflow:rest'
const REST_SECONDS_KEY = 'gymflow:restSeconds'
/** The screen stays on this long after the rest is over, then it may turn off again. */
const WAKE_AFTER_END_MS = 2 * 60_000
/** A rest left alone this long after its end disappears by itself (e.g. after the workout). */
const STALE_AFTER_END_MS = 10 * 60_000
/** Only beep if the end is this recent: after a locked screen the timer fires late, and a late beep would be noise. */
const BEEP_WINDOW_MS = 3000

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Private mode or storage blocked: the timer still works, it just won't survive a reload.
  }
}

function readRest(): RestState | null {
  const rest = parseRestState(readStorage(REST_KEY))
  return rest && restRemainingMs(rest, Date.now()) > -STALE_AFTER_END_MS ? rest : null
}

/** Rest timer between sets, shared by the tracker (starts it) and the app shell (shows it). */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [rest, setRest] = useState<RestState | null>(readRest)
  const [restSeconds, setRestSecondsState] = useState(() => clampRestSeconds(Number(readStorage(REST_SECONDS_KEY) ?? DEFAULT_REST_SECONDS)))

  useEffect(() => writeStorage(REST_KEY, rest && JSON.stringify(rest)), [rest])

  // End signal and auto-dismiss, scheduled for the exact moments instead of polling.
  useEffect(() => {
    if (!rest) return
    const remaining = restRemainingMs(rest, Date.now())
    const beep = window.setTimeout(() => {
      if (document.visibilityState === 'visible' && -restRemainingMs(rest, Date.now()) < BEEP_WINDOW_MS) playRestOver()
    }, Math.max(0, remaining))
    const stale = window.setTimeout(() => setRest(null), Math.max(0, remaining + STALE_AFTER_END_MS))
    return () => {
      window.clearTimeout(beep)
      window.clearTimeout(stale)
    }
  }, [rest])

  useWakeLockDuringRest(rest)

  const setRestSeconds = useCallback((seconds: number) => {
    const next = clampRestSeconds(seconds)
    setRestSecondsState(next)
    writeStorage(REST_SECONDS_KEY, String(next))
  }, [])

  const start = useCallback(
    (label: string) => {
      unlockAudio()
      setRest({ startedAt: Date.now(), durationMs: restSeconds * 1000, label })
    },
    [restSeconds],
  )
  const adjust = useCallback((deltaSeconds: number) => setRest((current) => current && adjustRest(current, deltaSeconds * 1000)), [])
  const dismiss = useCallback(() => setRest(null), [])

  const value = useMemo<RestTimerValue>(
    () => ({ rest, restSeconds, setRestSeconds, start, adjust, dismiss }),
    [rest, restSeconds, setRestSeconds, start, adjust, dismiss],
  )
  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>
}

/**
 * Keeps the screen on while resting, so the app stays in front and can play the end signal.
 * The browser drops the lock whenever the app is hidden; it is requested again on return.
 */
function useWakeLockDuringRest(rest: RestState | null) {
  useEffect(() => {
    if (!rest || !('wakeLock' in navigator)) return
    const releaseAt = rest.startedAt + rest.durationMs + WAKE_AFTER_END_MS
    if (Date.now() >= releaseAt) return

    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = () => {
      if (cancelled || document.visibilityState !== 'visible' || Date.now() >= releaseAt) return
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (cancelled) void sentinel.release()
          else lock = sentinel
        })
        .catch(() => {
          // Denied (e.g. low power mode): the screen may turn off, the timer stays correct.
        })
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    const timer = window.setTimeout(() => {
      cancelled = true
      void lock?.release()
    }, releaseAt - Date.now())
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      window.clearTimeout(timer)
      void lock?.release()
    }
  }, [rest])
}
