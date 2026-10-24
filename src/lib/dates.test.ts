import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, fromDateKey, isoWeek, startOfWeek, toDateKey, weekDays } from './dates'

describe('date keys', () => {
  it('round-trips local dates', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toDateKey(fromDateKey('2026-10-24'))).toBe('2026-10-24')
  })

  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    // Change to winter time in Germany: still exactly one calendar day.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(addDays('2026-03-29', -1)).toBe('2026-03-28')
  })

  it('counts whole days, even over a DST change', () => {
    expect(daysBetween('2026-10-20', '2026-10-27')).toBe(7)
    expect(daysBetween('2026-03-27', '2026-03-31')).toBe(4)
    expect(daysBetween('2026-10-27', '2026-10-20')).toBe(-7)
  })
})

describe('weeks', () => {
  it('starts on Monday', () => {
    expect(startOfWeek('2026-10-24')).toBe('2026-10-19') // Saturday
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19') // Sunday
    expect(startOfWeek('2026-10-19')).toBe('2026-10-19') // Monday
  })

  it('lists Monday to Sunday', () => {
    expect(weekDays('2026-10-22')).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'])
  })

  it.each([
    ['2026-01-01', 1],
    ['2026-10-24', 43],
    ['2026-12-31', 53],
    ['2027-01-03', 53], // still the last ISO week of 2026
    ['2027-01-04', 1],
    ['2021-01-03', 53],
  ])('ISO week of %s is %i', (date, week) => {
    expect(isoWeek(date)).toBe(week)
  })
})
