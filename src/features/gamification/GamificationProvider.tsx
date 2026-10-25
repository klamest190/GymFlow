import { Medal, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useSession } from '../../auth/authContext'
import { useToast, type ShowToast } from '../../components/ui/toastContext'
import { useAllLogs } from '../../hooks/useData'
import { useToday } from '../../hooks/useToday'
import { detectNewRecords, formatRecordValue, personalRecords, type PersonalRecord } from '../../lib/records'
import { detectProgressEvents, evaluateProgress, isSameState, type ProgressEvent } from '../../services/gamificationService'
import { repository } from '../../services/repository'
import type { GamificationState, WorkoutLog } from '../../types/models'
import { GamificationContext } from './gamificationContext'

const xpFormatter = new Intl.NumberFormat('de-DE')

function celebrate(toast: ShowToast, event: ProgressEvent) {
  if (event.kind === 'achievement') {
    const { title, description, icon } = event.achievement
    toast({ tone: 'reward', eyebrow: 'Erfolg freigeschaltet', title, description, icon })
  } else if (event.rankUp) {
    toast({
      tone: 'reward',
      eyebrow: 'Neuer Rang',
      title: `Willkommen in ${event.rank.label}!`,
      description: `Level ${event.level} erreicht. Ab jetzt trainierst du in der ${event.rank.label}-Liga.`,
      icon: event.rank.icon,
    })
  } else {
    toast({
      tone: 'reward',
      eyebrow: 'Level-Up',
      title: `Level ${event.level} erreicht!`,
      description: `Noch ${xpFormatter.format(event.xpToNext)} XP bis Level ${event.level + 1}.`,
      icon: TrendingUp,
    })
  }
}

/**
 * Keeps XP, level, rank and achievements in sync with the training history for the whole
 * signed-in app: derives them from all finished days (today counts once it's over, see
 * `evaluateProgress`), celebrates gains with toasts and mirrors the
 * result into `users/{uid}`. Screens read the derived value, so they stay correct even if the
 * mirror write fails (e.g. offline, or rules not deployed yet).
 */
export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useSession()
  const toast = useToast()
  const { logs, ready } = useAllLogs(user.uid)
  const stored = profile.gamification
  const today = useToday()
  const evaluation = useMemo(() => (ready ? evaluateProgress(logs, stored, today) : null), [ready, logs, stored, today])
  // Last state this device celebrated: prevents repeated toasts while our own write is still
  // on its way back through the profile snapshot (and under StrictMode's double effects).
  const celebrated = useRef<GamificationState | null>(null)
  const warned = useRef(false)

  usePersonalRecordToasts(ready ? logs : null, toast)

  useEffect(() => {
    if (!evaluation) return
    const { state } = evaluation
    // No baseline yet means a first sync (e.g. an existing history): store it silently instead
    // of celebrating every level and achievement at once.
    const baseline = celebrated.current ?? stored
    if (baseline) for (const event of detectProgressEvents(baseline, state)) celebrate(toast, event)
    celebrated.current = state

    if (stored && isSameState(stored, state)) return
    repository.saveGamification(user.uid, state).catch((error) => {
      if (warned.current) return
      warned.current = true
      console.warn('[GymFlow] saving gamification state failed', error)
    })
  }, [evaluation, stored, toast, user.uid])

  const value = useMemo(() => (evaluation ? { ...evaluation, logs } : null), [evaluation, logs])
  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

/** Wait until the weight stops changing, so stepping up 2,5 kg at a time ends in one toast. */
const RECORD_SETTLE_MS = 1500

/**
 * Celebrates a beaten personal record (heaviest set, or most reps for bodyweight exercises)
 * once per exercise and day. The first load only sets the baseline, so existing records from
 * the past never pop up.
 */
function usePersonalRecordToasts(logs: WorkoutLog[] | null, toast: ShowToast) {
  const records = useMemo(() => (logs ? personalRecords(logs) : null), [logs])
  const known = useRef<Map<string, PersonalRecord> | null>(null)
  const celebrated = useRef(new Set<string>())
  /** Per exercise and day: the record before today's session and the pending toast. */
  const pending = useRef(new Map<string, { previous: number; timer: number }>())

  useEffect(() => {
    if (!records) return
    const previous = known.current
    known.current = records
    if (!previous) return
    for (const { record, previous: before } of detectNewRecords(previous, records)) {
      const key = `${record.date}:${record.exerciseId}`
      if (celebrated.current.has(key)) continue
      const waiting = pending.current.get(key)
      window.clearTimeout(waiting?.timer)
      const baseline = waiting?.previous ?? before
      const timer = window.setTimeout(() => {
        pending.current.delete(key)
        celebrated.current.add(key)
        toast({
          tone: 'reward',
          eyebrow: 'Neue Bestleistung',
          title: `${record.exerciseName}: ${formatRecordValue(record.kind, record.value)}`,
          description: `Vorher ${formatRecordValue(record.kind, baseline)}. Stark!`,
          icon: Medal,
        })
      }, RECORD_SETTLE_MS)
      pending.current.set(key, { previous: baseline, timer })
    }
  }, [records, toast])

  useEffect(() => {
    const timers = pending.current
    return () => timers.forEach(({ timer }) => window.clearTimeout(timer))
  }, [])
}
