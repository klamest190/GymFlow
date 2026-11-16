import { useEffect } from 'react'

/**
 * Keeps the screen on while `active`. The browser drops the lock whenever the app is hidden;
 * it is requested again on return.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (cancelled) void sentinel.release()
          else lock = sentinel
        })
        .catch(() => {
          // Denied (e.g. low power mode): the screen may turn off.
        })
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [active])
}
