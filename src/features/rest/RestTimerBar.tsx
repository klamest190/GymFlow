import { AnimatePresence, m } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { haptic } from '../../hooks/useUi'
import { settle, snap } from '../../lib/motion'
import { formatRestClock, REST_STEP_SECONDS, restRemainingMs } from '../../lib/restTimer'
import { useRestTimer } from './restTimerContext'

/** Height of the bar on phones; the tab content and the tracker's add button make room for it. */
export const REST_BAR_HEIGHT = 72

/**
 * The running rest, on every tab: above the tab bar on phones, a floating panel on desktop.
 * After the end it counts the overtime until the next set is logged or it is dismissed.
 */
export function RestTimerBar() {
  const { rest, adjust, dismiss } = useRestTimer()
  const now = useNow(rest !== null)

  // `now` can lag up to one tick behind a rest that just started; never show more than its duration.
  const remaining = rest ? restRemainingMs(rest, Math.max(now, rest.startedAt)) : 0
  const over = remaining <= 0
  const progress = rest && rest.durationMs > 0 ? Math.min(1, 1 - remaining / rest.durationMs) : 1

  return (
    <AnimatePresence>
      {rest && (
        <m.section
          key="rest"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={settle}
          aria-label="Satzpause"
          style={{ height: REST_BAR_HEIGHT }}
          className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-40 overflow-hidden border-t border-line bg-surface-solid lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-95 lg:rounded-3xl lg:border lg:shadow-float"
        >
          {/* Progress fills with the rest: plate yellow means progress. */}
          <span className="absolute inset-x-0 top-0 h-1 bg-sunken" aria-hidden>
            <span
              className="block h-full origin-left bg-accent transition-transform duration-300 ease-linear"
              style={{ transform: `scaleX(${progress})` }}
            />
          </span>
          <div className="mx-auto flex h-full max-w-md items-center gap-3 px-4 lg:max-w-none">
            <div className="min-w-0 flex-1">
              <p role="timer" aria-label={over ? 'Pause vorbei' : 'Verbleibende Pause'} className="numeral text-[35px] leading-none tabular-nums">
                {formatRestClock(remaining)}
              </p>
              <p className={`mt-1 truncate text-[13px] font-medium ${over ? 'text-accent-fg' : 'text-muted'}`}>
                {over ? 'Weiter geht’s' : rest.label}
              </p>
              <span className="sr-only" role="status">
                {over ? 'Pause vorbei, weiter geht’s.' : ''}
              </span>
            </div>
            <BarButton label={`${REST_STEP_SECONDS} Sekunden weniger`} onClick={() => adjust(-REST_STEP_SECONDS)}>
              −15
            </BarButton>
            <BarButton label={`${REST_STEP_SECONDS} Sekunden mehr`} onClick={() => adjust(REST_STEP_SECONDS)}>
              +15
            </BarButton>
            <BarButton label="Pause beenden" onClick={dismiss}>
              <X className="size-4.5" strokeWidth={2.75} />
            </BarButton>
          </div>
        </m.section>
      )}
    </AnimatePresence>
  )
}

function BarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.9 }}
      transition={snap}
      onClick={() => {
        haptic()
        onClick()
      }}
      aria-label={label}
      className="grid h-11 min-w-11 shrink-0 place-items-center rounded-xl bg-sunken px-2 text-[14px] font-semibold tabular-nums transition-colors hover:bg-fg hover:text-bg"
    >
      {children}
    </m.button>
  )
}

/** The current time, refreshed four times a second while `active`. */
function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [active])
  return now
}
