import { describe, expect, it } from 'vitest'
import { getExercises } from '../data/exercises'
import { instructionSteps } from './instructionSteps'

const EXERCISES = [...getExercises('de'), ...getExercises('en')]

describe('instruction steps', () => {
  it('splits running text into sentences', () => {
    expect(instructionSteps('Aufrecht stehen. Arme beugen, bis 90° erreicht sind. Langsam senken!')).toEqual([
      'Aufrecht stehen.',
      'Arme beugen, bis 90° erreicht sind.',
      'Langsam senken!',
    ])
  })

  it('gives every catalog exercise a short sequence of real sentences, in both languages', () => {
    for (const exercise of EXERCISES) {
      const steps = instructionSteps(exercise.instructions)
      expect(steps.length, exercise.id).toBeGreaterThanOrEqual(2)
      expect(steps.length, exercise.id).toBeLessThanOrEqual(6)
      // No fragment from an abbreviation like "z. B." that ended a "sentence" early.
      for (const step of steps) expect(step.length, `${exercise.id}: ${step}`).toBeGreaterThan(20)
    }
  })
})
