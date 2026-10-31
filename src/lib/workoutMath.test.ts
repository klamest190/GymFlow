import { describe, expect, it } from 'vitest'
import { getExercise } from '../data/exercises'
import { createEntry, newSetValues } from './workoutMath'

describe('createEntry', () => {
  it('starts without sets: only logged sets are stored, so nothing counts before the first one', () => {
    const curls = getExercise('bicep-curls')!
    const entry = createEntry(curls, 0)
    expect(entry.perDumbbell).toBe(true)
    expect(entry.sets).toEqual([])
  })
})

describe('newSetValues', () => {
  it("starts a new exercise at 10 reps with the user's dumbbell weight, not the catalog recommendation", () => {
    expect(newSetValues(getExercise('bicep-curls')!, 5)).toEqual({ reps: 10, weightKg: 5 })
  })
})
