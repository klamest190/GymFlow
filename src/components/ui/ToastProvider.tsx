import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContext, type Toast, type ToastTone } from './toastContext'

const DURATION_MS = 4500
const MAX_VISIBLE = 3

const TONES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CircleCheck, className: 'bg-accent text-accent-ink' },
  error: { icon: CircleAlert, className: 'bg-danger text-white' },
  info: { icon: Info, className: 'bg-sunken text-fg' },
}

/** Glass toasts: top of the screen on phones (clear of the tab bar), bottom right on desktop. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])

  const show = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }].slice(-MAX_VISIBLE))
      window.setTimeout(() => dismiss(id), DURATION_MS)
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
              const { icon: Icon, className } = TONES[toast.tone]
              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  role={toast.tone === 'error' ? 'alert' : 'status'}
                  className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-3.5 pr-2.5 shadow-float"
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full ${className}`}>
                    <Icon className="size-4.5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[14px] font-semibold leading-snug">{toast.title}</p>
                    {toast.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{toast.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-sunken hover:text-fg"
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
