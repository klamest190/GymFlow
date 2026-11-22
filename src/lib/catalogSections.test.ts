import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { groupByRegion } from './catalogSections'

describe('catalog sections', () => {
  const sections = groupByRegion(EXERCISES)

  it('keep every exercise once, in catalog order within its region', () => {
    expect(sections.flatMap((section) => section.exercises)).toHaveLength(EXERCISES.length)
    for (const { exercises } of sections) {
      const ranks = exercises.map((exercise) => EXERCISES.indexOf(exercise))
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    }
  })

  it('start with the region of the first exercise, so Bizeps-Curls stay on top', () => {
    expect(sections[0].region).toBe('pull')
    expect(sections[0].exercises[0].id).toBe('bicep-curls')
    expect(sections[0].muscles).toBe('Rücken, Bizeps')
  })
})
