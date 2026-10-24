import { AnimatePresence, m } from 'framer-motion'
import type { ReactNode } from 'react'
import { useDelayedFlag } from '../../hooks/useDelayedFlag'

const EASE = [0.22, 1, 0.36, 1] as const

interface LoadableProps {
  ready: boolean
  /** Shown only if loading takes noticeably long (see `SKELETON_DELAY_MS`). */
  skeleton: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Calm loading state, in three steps: nothing for the first moment (cached data usually lands
 * within it), then a softly fading-in skeleton if it really takes longer, and finally a
 * crossfade to the content. Avoids the skeleton flashing up for a few frames.
 */
export function Loadable({ ready, skeleton, children, className }: LoadableProps) {
  const showSkeleton = useDelayedFlag(!ready)
  return (
    <AnimatePresence mode="wait" initial={false}>
      {ready ? (
        <m.div
          key="content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={className}
        >
          {children}
        </m.div>
      ) : showSkeleton ? (
        <m.div
          key="skeleton"
          aria-busy
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.35, ease: EASE }}
          className={className}
        >
          {skeleton}
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}
