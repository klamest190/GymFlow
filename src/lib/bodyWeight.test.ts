import { describe, expect, it } from 'vitest'
import rules from '../../firestore.rules?raw'
import type { BodyWeightEntry } from '../types/models'
import { MAX_BODY_WEIGHT, MIN_BODY_WEIGHT, parseWeight, weightChartPoints, weightTrend } from './bodyWeight'

const weighIn = (date: string, weightKg: number): BodyWeightEntry => ({ date, weightKg, updatedAt: 0 })

describe('parseWeight', () => {
  it.each([
    ['82,4', 82.4],
    ['82.4', 82.4],
    [' 80 ', 80],
    ['82,46', 82.5],
  ])('%j → %d', (input, expected) => expect(parseWeight(input)).toBe(expected))

  it.each(['', 'abc', '5', '1000'])('rejects %j', (input) => expect(parseWeight(input)).toBeNull())

  it('uses the same range as the security rules', () => {
    expect(rules).toContain(`weightKg >= ${MIN_BODY_WEIGHT}`)
    expect(rules).toContain(`weightKg <= ${MAX_BODY_WEIGHT}`)
  })
})

describe('weightTrend', () => {
  it('compares with the last weigh-in at least 30 days earlier', () => {
    const entries = [weighIn('2026-09-01', 85), weighIn('2026-09-20', 84), weighIn('2026-10-10', 83), weighIn('2026-10-24', 82.4)]
    expect(weightTrend(entries)).toMatchObject({ change: -1.6, days: 34, reference: { date: '2026-09-20' } })
  })

  it('falls back to the first weigh-in for a short history', () => {
    expect(weightTrend([weighIn('2026-10-20', 82), weighIn('2026-10-24', 82.4)])).toMatchObject({ change: 0.4, days: 4 })
  })

  it('has no change with a single weigh-in, and nothing without data', () => {
    expect(weightTrend([weighIn('2026-10-24', 82)])).toMatchObject({ change: null, reference: null })
    expect(weightTrend([])).toBeNull()
  })
})

describe('weightChartPoints', () => {
  it('spreads the weigh-ins of the last 90 days over the full width, heavier = higher', () => {
    const entries = [weighIn('2026-07-26', 90), weighIn('2026-07-27', 85), weighIn('2026-09-10', 82), weighIn('2026-10-24', 80)]
    const points = weightChartPoints(entries, '2026-10-24', 300, 100)
    expect(points.map((point) => point.entry.date)).toEqual(['2026-07-27', '2026-09-10', '2026-10-24'])
    expect(points[0].x).toBe(0)
    expect(points[2].x).toBe(300)
    expect(points[1].x).toBeCloseTo((45 / 89) * 300)
    expect(points[0].y).toBeLessThan(points[2].y)
  })

  it('needs at least two weigh-ins', () => expect(weightChartPoints([weighIn('2026-10-24', 80)], '2026-10-24', 300, 100)).toEqual([]))
})
