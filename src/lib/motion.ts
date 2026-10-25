import type { Transition } from 'framer-motion'

/**
 * Shared motion vocabulary, so everything that moves feels like one app:
 * - `snap`: direct responses to a tap (selection, toggles, small moves). Critically damped, no wobble.
 * - `settle`: larger rearrangements (list items moving, panels opening). Slightly softer, still no overshoot.
 * - `fade`: opacity-only changes.
 * Only transform and opacity are animated, which the browser composites without relayout.
 */
export const easeOut = [0.22, 1, 0.36, 1] as const

export const snap = { type: 'spring', stiffness: 600, damping: 45, mass: 0.7 } as const satisfies Transition
export const settle = { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 } as const satisfies Transition
export const fade = { duration: 0.16, ease: easeOut } as const satisfies Transition

/** Height reveal for content that expands in place (panels, the active set). */
export const reveal = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { height: { duration: 0.26, ease: easeOut }, opacity: { duration: 0.18, delay: 0.06 } } },
  exit: { height: 0, opacity: 0, transition: { height: { duration: 0.22, ease: easeOut }, opacity: { duration: 0.1 } } },
}
