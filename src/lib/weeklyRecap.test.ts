import { describe, expect, it } from 'vitest'
import { day, entry, log } from '../test/fixtures'
import { weeklyRecap } from './weeklyRecap'

// Week of 12.10. (previous) and week of 19.10. (reviewed); "today" is in the week of 26.10.
const logs = [
  day('2026-10-13', 3, 50),
  log('2026-10-19', [entry('bench', 3, 10, 50)]),
  log('2026-10-21', [entry('bench', 3, 10, 55)]),
  day('2026-10-23', 4, 20),
]

describe('weeklyRecap', () => {
  it('compares last week with the week before', () => {
    const recap = weeklyRecap(logs, {}, 3, '2026-10-26')
    expect(recap).toMatchObject({ weekStart: '2026-10-19', goalDays: 3, goalReached: true })
    expect(recap?.week.days).toBe(3)
    expect(recap?.previousWeek.days).toBe(1)
    expect(recap?.change.days).toBe(200)
  })

  it('lists new records and achievements of that week', () => {
    const recap = weeklyRecap(logs, { 'iron-will': '2026-10-21', 'first-workout': '2026-10-13' }, 3, '2026-10-26')
    expect(recap?.records.map((record) => [record.date, record.value])).toEqual([['2026-10-21', 55]])
    expect(recap?.achievements.map((achievement) => achievement.id)).toEqual(['iron-will'])
  })

  it('is offered Monday to Wednesday only', () => {
    expect(weeklyRecap(logs, {}, 3, '2026-10-28')).not.toBeNull() // Wednesday
    expect(weeklyRecap(logs, {}, 3, '2026-10-29')).toBeNull() // Thursday
  })

  it('stays away when there is nothing to review', () => {
    expect(weeklyRecap([], {}, 3, '2026-10-26')).toBeNull()
  })

  it('lists an exercise beaten twice only once, with the final value', () => {
    const twice = [...logs, log('2026-10-22', [entry('bench', 3, 10, 57.5)])]
    expect(weeklyRecap(twice, {}, 3, '2026-10-26')?.records.map((record) => record.value)).toEqual([57.5])
  })

  it('reports a missed goal', () => {
    expect(weeklyRecap(logs, {}, 5, '2026-10-26')?.goalReached).toBe(false)
  })
})
