import { AnimatePresence, m } from 'framer-motion'
import { CircleAlert, CircleCheck, Info, Sparkles, X } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { easeOut, settle, snap } from '../../lib/motion'
import { ToastContext, type Toast, type ToastTone } from './toastContext'

const DURATION_MS = 4500
const REWARD_DURATION_MS = 6500
const MAX_VISIBLE = 3

const TONES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: 'bg-fg text-bg' },
  error: { icon: CircleAlert, className: 'bg-danger-fill text-white' },
  info: { icon: Info, className: 'bg-sunken text-fg' },
  reward: { icon: Sparkles, className: 'bg-accent text-accent-ink' },
}

/** Toasts on a steel surface (rewards on graphite): top of the screen on phones (clear of the tab bar), bottom right on desktop. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])

  const show = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }].slice(-MAX_VISIBLE))
      window.setTimeout(() => dismiss(id), toast.tone === 'reward' ? REWARD_DURATION_MS : DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] z-[60] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-auto lg:items-end"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const tone = TONES[toast.tone]
              const Icon = toast.icon ?? tone.icon
              const reward = toast.tone === 'reward'
              return (
                <m.div
                  key={toast.id}
                  layout="position"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.14 } }}
                  transition={settle}
                  role={toast.tone === 'error' ? 'alert' : 'status'}
                  className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border p-3.5 pr-2.5 shadow-float ${
                    reward ? 'border-white/10 bg-accent-ink text-white' : 'border-line bg-surface-solid'
                  }`}
                >
                  <span className={`relative grid size-8 shrink-0 place-items-center rounded-full ${tone.className}`}>
                    {reward && <RewardPulse />}
                    <m.span
                      className="relative"
                      initial={reward ? { scale: 0.4 } : false}
                      animate={{ scale: 1 }}
                      transition={{ ...snap, delay: 0.08 }}
                    >
                      <Icon className="size-4.5" strokeWidth={2.5} />
                    </m.span>
                  </span>
                  <div className="relative min-w-0 flex-1 pt-0.5">
                    {toast.eyebrow && (
                      <p className={`text-[12px] font-semibold ${reward ? 'text-accent' : 'text-muted'}`}>{toast.eyebrow}</p>
                    )}
                    <p className="text-[15px] font-semibold leading-snug">{toast.title}</p>
                    {toast.description && (
                      <p className={`mt-0.5 text-[13px] leading-snug ${reward ? 'text-white/65' : 'text-muted'}`}>{toast.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className={`relative grid size-7 shrink-0 place-items-center rounded-lg transition ${
                      reward ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-muted hover:bg-sunken hover:text-fg'
                    }`}
                    aria-label="Hinweis schließen"
                  >
                    <X className="size-3.5" strokeWidth={2.5} />
                  </button>
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/** Accent ring expanding out of the icon once: the single celebratory moment. */
function RewardPulse() {
  return (
    <m.span
      aria-hidden
      className="absolute inset-0 rounded-full bg-accent"
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 0.9, ease: easeOut }}
    />
  )
}
