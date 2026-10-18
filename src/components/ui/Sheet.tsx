import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsDesktop } from '../../hooks/useUi'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 } as const

/** Bottom sheet on mobile (drag the header down to dismiss), centered modal on desktop. */
export function Sheet({ open, onClose, title, subtitle, children, footer }: SheetProps) {
  const isDesktop = useIsDesktop()
  const dragControls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-8" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[30px] border border-line bg-surface-solid/95 shadow-float backdrop-blur-2xl lg:max-h-[78vh] lg:max-w-2xl lg:rounded-4xl"
            initial={isDesktop ? { opacity: 0, scale: 0.94, y: 12 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: '100%' }}
            transition={spring}
            drag={isDesktop ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <header
              className="shrink-0 touch-none px-5 pb-3 pt-2.5 lg:px-7 lg:pt-6"
              onPointerDown={(event) => !isDesktop && dragControls.start(event)}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-sunken lg:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight lg:text-2xl">{title}</h2>
                  {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-muted transition hover:text-fg active:scale-90"
                  aria-label="Schließen"
                >
                  <X className="size-4.5" strokeWidth={2.5} />
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 lg:px-7">{children}</div>
            {footer && (
              <footer className="shrink-0 border-t border-line px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 lg:px-7 lg:pb-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
