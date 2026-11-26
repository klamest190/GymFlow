import { describe, expect, it } from 'vitest'
import { CATALOG_ORDER, exerciseName, getExercise, getExercises } from './exercises'

const EXERCISES = getExercises('de')

describe('catalog order', () => {
  it('places every catalog exercise exactly once', () => {
    expect([...CATALOG_ORDER].sort()).toEqual(EXERCISES.map((exercise) => exercise.id).sort())
  })

  it('lists the exercises in that order, easy and effective first', () => {
    expect(EXERCISES.map((exercise) => exercise.id)).toEqual([...CATALOG_ORDER])
    expect(EXERCISES[0].id).toBe('bicep-curls')
  })

  it('keeps the advanced exercises at the end', () => {
    const firstAdvanced = EXERCISES.findIndex((exercise) => exercise.difficulty === 'advanced')
    expect(EXERCISES.slice(firstAdvanced).every((exercise) => exercise.difficulty === 'advanced')).toBe(true)
  })
})

describe('languages', () => {
  const english = getExercises('en')

  it('keeps the same exercises, order and training data in English', () => {
    expect(english.map((exercise) => exercise.id)).toEqual(EXERCISES.map((exercise) => exercise.id))
    english.forEach((exercise, index) => {
      const german = EXERCISES[index]
      expect(exercise.primaryMuscle).toBe(german.primaryMuscle)
      expect(exercise.defaultReps).toBe(german.defaultReps)
      expect(exercise.name).not.toBe('')
      expect(exercise.formCues).toHaveLength(german.formCues.length)
    })
  })

  it('translates the texts', () => {
    expect(getExercise('squats', 'de')?.name).toBe('Squats (Kniebeugen)')
    expect(getExercise('squats', 'en')?.name).toBe('Squats')
    expect(getExercise('push-ups', 'en')?.description).not.toBe(getExercise('push-ups', 'de')?.description)
  })

  it('finds an exercise by its name in either language', () => {
    const terms = getExercise('push-ups', 'en')?.searchTerms ?? []
    expect(terms).toContain('push-ups')
    expect(terms).toContain('liegestütze')
  })

  it('names a logged entry after the catalog, or by its stored name once the exercise is gone', () => {
    expect(exerciseName('push-ups', 'Liegestütze')).toBe('Liegestütze')
    expect(exerciseName('removed-exercise', 'Alte Übung')).toBe('Alte Übung')
  })
})
