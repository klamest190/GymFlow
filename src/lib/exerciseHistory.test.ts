import { describe, expect, it } from 'vitest'
import { entry } from '../test/fixtures'
import { formatLastTime } from './exerciseHistory'

const withSets = (sets: [number, number | null][]) => {
  const base = entry('curls', 0, 0, sets[0][1])
  return { ...base, sets: sets.map(([reps, weightKg], index) => ({ id: String(index), reps, weightKg })) }
}

describe('formatLastTime', () => {
  it('names every rep count, since reps are what a fixed pair of dumbbells progresses by', () => {
    expect(formatLastTime(withSets([[12, 8], [10, 8], [8, 8]]))).toBe('12, 10, 8 Wdh. mit 8 kg')
  })

  it('shortens equal sets', () => {
    expect(formatLastTime(withSets([[10, 7.5], [10, 7.5], [10, 7.5]]))).toBe('3 × 10 Wdh. mit 7,5 kg')
  })

  it('leaves out the weight for bodyweight sets', () => {
    expect(formatLastTime(withSets([[20, null], [18, null]]))).toBe('20, 18 Wdh.')
  })

  it('lists each set when the weight changed', () => {
    expect(formatLastTime(withSets([[12, 8], [10, 9]]))).toBe('12 × 8 kg, 10 × 9 kg')
  })
})
