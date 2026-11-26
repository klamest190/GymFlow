import { describe, expect, it } from 'vitest'
import { isExerciseLockedFor } from '../features/guest/guestGate'
import { EXERCISE_ANIMATIONS } from '../features/exercises/animation/poses'
import { getExercises } from './exercises'
import { GUEST_EXERCISE_IDS } from './guest'

const EXERCISES = getExercises('de')

describe('guest exercises', () => {
  it('are catalog exercises with an animation, none of them advanced', () => {
    for (const id of GUEST_EXERCISE_IDS) {
      const exercise = EXERCISES.find((candidate) => candidate.id === id)
      expect(exercise, id).toBeDefined()
      expect(exercise?.difficulty).not.toBe('advanced')
      expect(id in EXERCISE_ANIMATIONS, id).toBe(true)
    }
  })

  it('come first in the catalog, so the locked ones follow them', () => {
    expect(EXERCISES.slice(0, GUEST_EXERCISE_IDS.size).every((exercise) => GUEST_EXERCISE_IDS.has(exercise.id))).toBe(true)
  })

  it('locks the rest for guests only', () => {
    expect(isExerciseLockedFor(true, 'bicep-curls')).toBe(false)
    expect(isExerciseLockedFor(true, 'v-ups')).toBe(true)
    expect(isExerciseLockedFor(false, 'v-ups')).toBe(false)
  })
})
