import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, CircleCheck, Info, Sparkles, X } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext, type Toast, type ToastTone } from './toastContext'

const DURATION_MS = 4500
const REWARD_DURATION_MS = 6500
const MAX_VISIBLE = 3

const TONES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: 'bg-accent text-accent-ink' },
  error: { icon: CircleAlert, className: 'bg-danger text-white' },
  info: { icon: Info, className: 'bg-sunken text-fg' },
  reward: { icon: Sparkles, className: 'bg-accent text-accent-ink shadow-accent' },
}

/** Glass toasts: top of the screen on phones (clear of the tab bar), bottom right on desktop. */
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
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: reward ? 0.9 : 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: reward ? 320 : 420, damping: reward ? 22 : 32 }}
                  role={toast.tone === 'error' ? 'alert' : 'status'}
                  className={`glass pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl p-3.5 pr-2.5 shadow-float ${
                    reward ? 'ring-1 ring-accent/50' : ''
                  }`}
                >
                  {reward && <RewardSweep />}
                  <span className={`relative grid size-8 shrink-0 place-items-center rounded-full ${tone.className}`}>
                    {reward && <RewardPulse />}
                    <motion.span
                      className="relative"
                      initial={reward ? { scale: 0.3, rotate: -30 } : false}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
                    >
                      <Icon className="size-4.5" strokeWidth={2.5} />
                    </motion.span>
                  </span>
                  <div className="relative min-w-0 flex-1 pt-0.5">
                    {toast.eyebrow && (
                      <p className="text-[11px] font-bold uppercase tracking-widest text-accent-fg">{toast.eyebrow}</p>
                    )}
                    <p className="text-[14px] font-semibold leading-snug">{toast.title}</p>
                    {toast.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{toast.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="relative grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-sunken hover:text-fg"
                    aria-label="Hinweis schließen"
                  >
                    <X className="size-3.5" strokeWidth={2.5} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/** One band of light sweeping across the card. */
function RewardSweep() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-accent/30 to-transparent"
      initial={{ x: '-120%' }}
      animate={{ x: '260%' }}
      transition={{ duration: 1.2, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
    />
  )
}

/** Accent ring expanding out of the icon, twice. */
function RewardPulse() {
  return (
    <motion.span
      aria-hidden
      className="absolute inset-0 rounded-full bg-accent"
      initial={{ scale: 1, opacity: 0.6 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 1.1, repeat: 1, ease: 'easeOut' }}
    />
  )
}
