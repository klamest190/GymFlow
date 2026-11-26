import { describe, expect, it } from 'vitest'
import { getExercises } from '../data/exercises'
import { GUEST_EXERCISE_IDS } from '../data/guest'
import type { MuscleGroup, WorkoutLog } from '../types/models'
import { suggestRegion } from './regionSuggestion'

const EXERCISES = getExercises('de')

const log = (date: string, muscle: MuscleGroup, sets = 1) =>
  ({ date, entries: [{ primaryMuscle: muscle, sets: Array.from({ length: sets }, () => ({})) }] }) as unknown as WorkoutLog

describe('region suggestion', () => {
  it('starts a new user with pulling: Bizeps-Curls first', () => {
    const suggestion = suggestRegion([], EXERCISES, '2026-11-22')
    expect(suggestion?.region).toBe('pull')
    expect(suggestion?.lastDate).toBeNull()
    expect(suggestion?.exercises.map((exercise) => exercise.id)[0]).toBe('bicep-curls')
    expect(suggestion?.exercises).toHaveLength(3)
  })

  it('suggests the region that waited longest, never-trained ones first', () => {
    const logs = [log('2026-11-20', 'biceps'), log('2026-11-18', 'quads'), log('2026-11-21', 'chest')]
    expect(suggestRegion(logs, EXERCISES, '2026-11-22')?.region).toBe('core')
    const all = [...logs, log('2026-11-15', 'core')]
    expect(suggestRegion(all, EXERCISES, '2026-11-22')).toMatchObject({ region: 'core', lastDate: '2026-11-15' })
  })

  it('ignores exercises without sets and the day itself', () => {
    const logs = [log('2026-11-10', 'biceps'), log('2026-11-21', 'back', 0), log('2026-11-22', 'biceps')]
    const others = [log('2026-11-19', 'quads'), log('2026-11-19', 'chest'), log('2026-11-19', 'core')]
    expect(suggestRegion([...logs, ...others], EXERCISES, '2026-11-22')).toMatchObject({ region: 'pull', lastDate: '2026-11-10' })
  })

  it('only offers what a guest can add', () => {
    const unlocked = EXERCISES.filter((exercise) => GUEST_EXERCISE_IDS.has(exercise.id))
    const logs = [log('2026-11-20', 'biceps'), log('2026-11-19', 'quads'), log('2026-11-21', 'chest')]
    // No core exercise is free, so core is never suggested to a guest.
    const suggestion = suggestRegion(logs, unlocked, '2026-11-22')
    expect(suggestion?.region).toBe('legs')
    expect(suggestion?.exercises.every((exercise) => GUEST_EXERCISE_IDS.has(exercise.id))).toBe(true)
  })
})
