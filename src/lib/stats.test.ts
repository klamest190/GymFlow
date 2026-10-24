import { describe, expect, it } from 'vitest'
import { day, entry, log } from '../test/fixtures'
import { activeWeekStreak, daysSinceLastWorkout, exerciseProgress, formatCompact, heatmapGrid, muscleDistribution, percentChange, summarize, weeklySeries } from './stats'
import { computeTotals } from './workoutMath'

describe('computeTotals', () => {
  it('sums sets, reps and volume; bodyweight adds no volume', () => {
    const totals = computeTotals([entry('bench', 3, 10, 60), entry('crunches', 2, 20)])
    expect(totals).toEqual({ exercises: 2, sets: 5, reps: 70, volumeKg: 1800 })
  })
})

describe('summarize / percentChange', () => {
  const logs = [day('2026-10-19', 3, 20), day('2026-10-21', 2, 50), day('2026-10-26', 4, 10)]

  it('only counts logs inside the range', () => {
    expect(summarize(logs, '2026-10-19', '2026-10-25')).toMatchObject({ days: 2, sets: 5, reps: 50, volumeKg: 600 + 1000 })
  })

  it('reports no change without a baseline', () => {
    expect(percentChange(10, 0)).toBeNull()
    expect(percentChange(15, 10)).toBe(50)
    expect(percentChange(5, 10)).toBe(-50)
  })

  it('formats large numbers compactly', () => {
    expect(formatCompact(1284)).toBe('1.284')
    expect(formatCompact(12_900)).toBe('12,9k')
  })
})

describe('weekly views', () => {
  const logs = [day('2026-10-05'), day('2026-10-12'), day('2026-10-14'), day('2026-10-20')]

  it('builds one point per week, oldest first, marking the current one', () => {
    const series = weeklySeries(logs, '2026-10-24', 3)
    expect(series.map((week) => week.weekStart)).toEqual(['2026-10-05', '2026-10-12', '2026-10-19'])
    expect(series.map((week) => week.days)).toEqual([1, 2, 1])
    expect(series[2].isCurrent).toBe(true)
    expect(series[1].previous.days).toBe(1)
  })

  it('counts consecutive active weeks; an empty running week does not break the streak', () => {
    expect(activeWeekStreak(logs, '2026-10-24')).toBe(3)
    expect(activeWeekStreak(logs, '2026-10-27')).toBe(3)
    expect(activeWeekStreak(logs, '2026-11-03')).toBe(0)
  })

  it('knows the days since the last workout', () => {
    expect(daysSinceLastWorkout(logs, '2026-10-24')).toBe(4)
    expect(daysSinceLastWorkout([], '2026-10-24')).toBeNull()
  })
})

describe('muscleDistribution', () => {
  const logs = [log('2026-10-20', [entry('bench', 4, 10, 60, { primary: 'chest', secondary: ['triceps'] }), entry('curl', 2, 10, 10, { primary: 'biceps' })])]

  it('counts sets per primary muscle', () => {
    expect(muscleDistribution(logs, '2026-10-01', false)).toEqual([
      { muscle: 'chest', sets: 4, share: 4 / 6 },
      { muscle: 'biceps', sets: 2, share: 2 / 6 },
    ])
  })

  it('adds secondary muscles at half a set', () => {
    const triceps = muscleDistribution(logs, '2026-10-01', true).find((share) => share.muscle === 'triceps')
    expect(triceps?.sets).toBe(2)
  })

  it('ignores logs before the start date', () => {
    expect(muscleDistribution(logs, '2026-10-21', false)).toEqual([])
  })
})

describe('heatmapGrid', () => {
  it('returns full weeks ending with the current one, future days empty', () => {
    const grid = heatmapGrid([day('2026-10-20', 3)], '2026-10-24', 2, 'sets')
    expect(grid).toHaveLength(2)
    expect(grid.every((week) => week.length === 7)).toBe(true)
    expect(grid[0][0].date).toBe('2026-10-12')
    expect(grid[1][1]).toMatchObject({ date: '2026-10-20', level: 1 })
    expect(grid[1][6]).toMatchObject({ date: '2026-10-25', level: 0 })
  })

  it('grades training days by quartile of the own history', () => {
    const logs = [day('2026-10-13', 2), day('2026-10-14', 4), day('2026-10-15', 6), day('2026-10-16', 8)]
    const levels = heatmapGrid(logs, '2026-10-18', 1, 'sets')[0].slice(0, 5).map((cell) => cell.level)
    expect(levels).toEqual([0, 1, 2, 3, 4])
  })
})

describe('exerciseProgress', () => {
  it('lists the heaviest set and total reps per session, oldest first', () => {
    const logs = [log('2026-10-22', [entry('bench', 3, 8, 70)]), log('2026-10-20', [entry('bench', 3, 10, 60)])]
    expect(exerciseProgress(logs, 'bench')).toEqual([
      { date: '2026-10-20', bestWeightKg: 60, totalReps: 30 },
      { date: '2026-10-22', bestWeightKg: 70, totalReps: 24 },
    ])
  })
})
