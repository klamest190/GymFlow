import { describe, expect, it } from 'vitest'
import { CATALOG_ORDER, EXERCISES } from './exercises'

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
