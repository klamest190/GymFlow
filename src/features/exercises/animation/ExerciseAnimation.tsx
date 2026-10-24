import { animate, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { Camera } from './camera'
import { ExerciseFigure } from './ExerciseFigure'
import { EXERCISE_ANIMATIONS, skeletonAt, type ExerciseAnimationSpec } from './poses'
import { stageLayout } from './scene'

/** Pause at both turning points of a repetition, like a controlled rep in the gym. */
const HOLD_SECONDS = 0.35

/**
 * One repetition per cycle in the exercise's tempo (slower on the lowering part). Starts from
 * the still frame, so starting/stopping on hover doesn't jump. With "reduce motion" enabled in
 * the OS, only the still frame is shown.
 */
export function ExerciseAnimation({
  exerciseId,
  playing = true,
  compact,
  camera,
  label,
}: {
  exerciseId: string
  playing?: boolean
  /** Thumbnail: fills more of the stage. */
  compact?: boolean
  /** A camera the viewer turns: framed for every angle. Default: the exercise's fixed angle. */
  camera?: Camera
  label: string
}) {
  const spec = EXERCISE_ANIMATIONS[exerciseId] as ExerciseAnimationSpec | undefined
  const reduceMotion = useReducedMotion()
  const running = Boolean(spec) && playing && !reduceMotion
  const [progress, setProgress] = useState(spec?.still ?? 0)

  useEffect(() => {
    if (!spec || !running) return
    const [forward, back] = spec.tempo
    const total = forward + HOLD_SECONDS + back + HOLD_SECONDS
    // The cycle begins at whichever end the still frame is closer to.
    const fromTurningPoint = spec.still >= 0.5
    const first = fromTurningPoint ? back : forward
    const keyframes = fromTurningPoint ? [1, 1, 0, 0, 1] : [0, 0, 1, 1, 0]
    const times = [0, HOLD_SECONDS, HOLD_SECONDS + first, 2 * HOLD_SECONDS + first, total].map((time) => time / total)
    const controls = animate(keyframes[0], keyframes, {
      duration: total,
      times,
      ease: ['linear', 'easeInOut', 'linear', 'easeInOut'],
      repeat: Infinity,
      onUpdate: setProgress,
    })
    return () => controls.stop()
  }, [spec, running])

  const orbit = Boolean(camera)
  const layout = useMemo(() => (spec ? stageLayout(spec, orbit ? null : spec.camera, orbit ? 1 : compact ? 0.94 : 0.88) : null), [spec, orbit, compact])
  const shown = running ? progress : (spec?.still ?? 0)
  const skeleton = useMemo(() => (spec ? skeletonAt(spec, shown) : null), [spec, shown])
  if (!spec || !skeleton || !layout) return null

  return (
    <div role="img" aria-label={label} className="size-full">
      <ExerciseFigure spec={spec} skeleton={skeleton} camera={camera ?? spec.camera} layout={layout} />
    </div>
  )
}
