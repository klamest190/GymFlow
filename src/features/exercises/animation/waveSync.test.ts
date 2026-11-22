import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../../../data/exercises'
import { DEFAULT_TEMPO, waveHeight, type WavePlan } from '../../../lib/tempoWave'
import { EXERCISE_ANIMATIONS, waveProgress } from './poses'

const withWave = EXERCISES.filter((exercise) => !exercise.noWave)

describe('figure in the training wave', () => {
  it('starts every set in the starting position of the wave', () => {
    for (const exercise of withWave) {
      const spec = EXERCISE_ANIMATIONS[exercise.id]
      const plan: WavePlan = { tempo: DEFAULT_TEMPO, reps: 3, lowersFirst: Boolean(exercise.lowersFirst) }
      const start = waveProgress(spec, plan.lowersFirst, waveHeight(plan, 0))
      expect(start, exercise.id).toBe(spec.waveStart === 'to' ? 1 : 0)
    }
  })

  it('reaches the turning point of the animation in the middle of a repetition', () => {
    for (const exercise of withWave) {
      const spec = EXERCISE_ANIMATIONS[exercise.id]
      const plan: WavePlan = { tempo: DEFAULT_TEMPO, reps: 3, lowersFirst: Boolean(exercise.lowersFirst) }
      const firstHalf = plan.lowersFirst ? plan.tempo.lowerSeconds : plan.tempo.liftSeconds
      const turn = waveProgress(spec, plan.lowersFirst, waveHeight(plan, firstHalf))
      expect(turn, exercise.id).toBeCloseTo(spec.waveStart === 'to' ? 0 : 1)
    }
  })

  it('matches the direction of each animation: the slow half is the lowering one', () => {
    // The animations are slower on the lowering (eccentric) half. Counted from where the set
    // starts, an exercise that lowers first must therefore have its slow half first.
    for (const exercise of withWave) {
      const spec = EXERCISE_ANIMATIONS[exercise.id]
      const [forward, back] = spec.tempo
      const [first, second] = spec.waveStart === 'to' ? [back, forward] : [forward, back]
      expect(first > second, exercise.id).toBe(Boolean(exercise.lowersFirst))
    }
  })
})
