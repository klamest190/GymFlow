import { Suspense } from 'react'
import { LazyExerciseAnimation } from './lazyFigures'

/**
 * The exercise's figure as a small still picture for lists; it moves while `playing`. Decorative:
 * the row beside it names the exercise. `dimmed` for locked exercises (the row shows the lock).
 */
export function FigureThumb({
  exerciseId,
  playing = false,
  dimmed,
  className = 'size-12',
}: {
  exerciseId: string
  playing?: boolean
  dimmed?: boolean
  className?: string
}) {
  return (
    <span aria-hidden className={`relative block shrink-0 overflow-hidden rounded-xl bg-sunken ${className}`}>
      <span className={`block size-full ${dimmed ? 'opacity-30' : ''}`}>
        <Suspense fallback={null}>
          <LazyExerciseAnimation exerciseId={exerciseId} playing={playing} compact label="" />
        </Suspense>
      </span>
    </span>
  )
}
