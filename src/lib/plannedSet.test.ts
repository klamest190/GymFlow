import { describe, expect, it } from 'vitest'
import { entry, log } from '../test/fixtures'
import { buildExerciseHistory } from './exerciseHistory'
import { lastSessionBefore, nextPlannedSet } from './plannedSet'

const curls = (sets: number, reps: number, weightKg: number | null = 8) => entry('curls', sets, reps, weightKg, { perDumbbell: true })
const FALLBACK = { reps: 10, weightKg: 5 }

describe('lastSessionBefore', () => {
  const history = buildExerciseHistory([
    log('2026-10-20', [curls(3, 10)]),
    log('2026-10-24', [curls(3, 12)]),
    log('2026-10-27', [curls(2, 9)]),
  ])

  it('finds the most recent session strictly before the day', () => {
    expect(lastSessionBefore(history, 'curls', '2026-10-27')?.date).toBe('2026-10-24')
    expect(lastSessionBefore(history, 'curls', '2026-10-31')?.date).toBe('2026-10-27')
  })

  it('returns null without an earlier session', () => {
    expect(lastSessionBefore(history, 'curls', '2026-10-20')).toBeNull()
    expect(lastSessionBefore(history, 'squats', '2026-10-31')).toBeNull()
  })

  it('skips exercises that were added but never got a set', () => {
    const withEmpty = buildExerciseHistory([log('2026-10-20', [curls(3, 10)]), log('2026-10-25', [curls(0, 10)])])
    expect(lastSessionBefore(withEmpty, 'curls', '2026-10-31')?.date).toBe('2026-10-20')
  })
})

describe('nextPlannedSet', () => {
  it('repeats set n of the last session', () => {
    const previous = entry('curls', 0, 0, 8, { perDumbbell: true })
    previous.sets = [
      { id: 'a', reps: 12, weightKg: 8 },
      { id: 'b', reps: 10, weightKg: 8 },
    ]
    const today = curls(1, 12)
    expect(nextPlannedSet(today, previous, FALLBACK)).toEqual({ reps: 10, weightKg: 8, extra: false })
  })

  it('copies the last logged set once the last session is used up', () => {
    const today = curls(3, 11, 9)
    expect(nextPlannedSet(today, curls(3, 10), FALLBACK)).toEqual({ reps: 11, weightKg: 9, extra: true })
  })

  it('starts a new exercise at the fallback values', () => {
    expect(nextPlannedSet(curls(0, 0), null, FALLBACK)).toEqual({ reps: 10, weightKg: 5, extra: false })
  })

  it('uses the template plan only when there is no last session', () => {
    const fromTemplate = { ...curls(0, 0), plannedSets: [{ reps: 15, weightKg: 6 }] }
    expect(nextPlannedSet(fromTemplate, null, FALLBACK)).toEqual({ reps: 15, weightKg: 6, extra: false })
    expect(nextPlannedSet(fromTemplate, curls(3, 10), FALLBACK)).toEqual({ reps: 10, weightKg: 8, extra: false })
  })

  it('keeps only the reps of an old session whose weight was the total of both dumbbells', () => {
    const legacy = entry('curls', 3, 10, 16)
    expect(nextPlannedSet(curls(0, 0), legacy, FALLBACK)).toEqual({ reps: 10, weightKg: 5, extra: false })
  })
})
