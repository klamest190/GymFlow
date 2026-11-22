import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import { useState } from 'react'
import { waveHeight, type WavePlan } from '../../../lib/tempoWave'
import { ExerciseAnimation } from './ExerciseAnimation'
import { EXERCISE_ANIMATIONS, waveProgress } from './poses'

/**
 * The 3D figure moving with the training wave: it shows the same moment as the wave's dot, so it
 * demonstrates every repetition in the user's tempo. `seconds` as in lib/tempoWave.ts.
 */
export function WaveFigure({ exerciseId, plan, seconds, label }: { exerciseId: string; plan: WavePlan; seconds: MotionValue<number>; label: string }) {
  const spec = EXERCISE_ANIMATIONS[exerciseId]
  const [height, setHeight] = useState(() => waveHeight(plan, seconds.get()))
  useMotionValueEvent(seconds, 'change', (value) => setHeight(waveHeight(plan, value)))
  if (!spec) return null
  return <ExerciseAnimation exerciseId={exerciseId} compact progress={waveProgress(spec, plan.lowersFirst, height)} label={label} />
}
