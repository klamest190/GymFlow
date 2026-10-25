import { describe, expect, it } from 'vitest'
import { getExercise } from '../data/exercises'
import { createEntry } from './workoutMath'

describe('createEntry', () => {
  it("starts every set at the user's dumbbell weight, counted per dumbbell", () => {
    const curls = getExercise('bicep-curls')!
    const entry = createEntry(curls, 0, 5)
    expect(entry.perDumbbell).toBe(true)
    expect(entry.sets).toHaveLength(curls.defaultSets)
    expect(entry.sets.every((set) => set.weightKg === 5 && set.reps === curls.defaultReps)).toBe(true)
  })
})
