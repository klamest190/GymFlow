import { describe, expect, it } from 'vitest'
import { getExercise } from '../data/exercises'
import { createEntry, NEW_ENTRY_REPS, NEW_ENTRY_SETS } from './workoutMath'

describe('createEntry', () => {
  it("starts every set at the user's dumbbell weight, counted per dumbbell", () => {
    const curls = getExercise('bicep-curls')!
    const entry = createEntry(curls, 0, 5)
    expect(entry.perDumbbell).toBe(true)
    expect(entry.sets).toHaveLength(NEW_ENTRY_SETS)
    expect(entry.sets.every((set) => set.weightKg === 5 && set.reps === NEW_ENTRY_REPS)).toBe(true)
  })

  it('starts with a single set of 10 reps, not the catalog recommendation', () => {
    const squats = getExercise('squats')!
    expect(squats.defaultSets).toBeGreaterThan(1)
    expect(createEntry(squats, 0, 5).sets.map((set) => set.reps)).toEqual([10])
  })
})
