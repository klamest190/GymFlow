import { useEffect, useState } from 'react'
import { todayKey } from '../lib/dates'
import type { DateKey } from '../types/models'

/**
 * Today's date key that rolls over at midnight, also when the app stays open overnight. Phones
 * pause timers in the background, so it re-checks whenever the app becomes visible again.
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(todayKey)

  useEffect(() => {
    const refresh = () => setToday(todayKey())
    const now = new Date()
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = window.setTimeout(refresh, nextMidnight.getTime() - now.getTime() + 1000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [today])

  return today
}
