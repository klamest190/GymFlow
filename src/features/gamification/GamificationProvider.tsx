import { TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useSession } from '../../auth/authContext'
import { useToast, type ShowToast } from '../../components/ui/toastContext'
import { useAllLogs } from '../../hooks/useData'
import { detectProgressEvents, evaluateProgress, isSameState, type ProgressEvent } from '../../services/gamificationService'
import { repository } from '../../services/repository'
import type { GamificationState } from '../../types/models'
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
 * signed-in app: derives them live from all logs, celebrates gains with toasts and mirrors the
 * result into `users/{uid}`. Screens read the derived value, so they stay correct even if the
 * mirror write fails (e.g. offline, or rules not deployed yet).
 */
export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useSession()
  const toast = useToast()
  const { logs, ready } = useAllLogs(user.uid)
  const stored = profile.gamification
  const evaluation = useMemo(() => (ready ? evaluateProgress(logs, stored) : null), [ready, logs, stored])
  // Last state this device celebrated: prevents repeated toasts while our own write is still
  // on its way back through the profile snapshot (and under StrictMode's double effects).
  const celebrated = useRef<GamificationState | null>(null)
  const warned = useRef(false)

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

  return <GamificationContext.Provider value={evaluation}>{children}</GamificationContext.Provider>
}
