import { describe, expect, it } from 'vitest'
import { adjustRest, clampRestSeconds, formatRestClock, parseRestState, restRemainingMs, type RestState } from './restTimer'

const rest: RestState = { startedAt: 1_000_000, durationMs: 90_000, label: 'Satz 2, Curls' }

describe('restRemainingMs', () => {
  it('counts down from the start time, so a locked screen or reload changes nothing', () => {
    expect(restRemainingMs(rest, rest.startedAt)).toBe(90_000)
    expect(restRemainingMs(rest, rest.startedAt + 60_000)).toBe(30_000)
  })

  it('goes negative once the rest is over', () => {
    expect(restRemainingMs(rest, rest.startedAt + 102_000)).toBe(-12_000)
  })
})

describe('adjustRest', () => {
  it('adds or removes 15 seconds', () => {
    expect(adjustRest(rest, 15_000).durationMs).toBe(105_000)
    expect(adjustRest(rest, -15_000).durationMs).toBe(75_000)
  })

  it('never drops below zero', () => {
    expect(adjustRest({ ...rest, durationMs: 10_000 }, -15_000).durationMs).toBe(0)
  })
})

describe('formatRestClock', () => {
  it('shows minutes and seconds, rounding the countdown up', () => {
    expect(formatRestClock(90_000)).toBe('1:30')
    expect(formatRestClock(71_200)).toBe('1:12')
    expect(formatRestClock(400)).toBe('0:01')
  })

  it('shows the overtime with a plus', () => {
    expect(formatRestClock(0)).toBe('0:00')
    expect(formatRestClock(-12_300)).toBe('+0:12')
  })
})

describe('clampRestSeconds', () => {
  it('keeps the setting between 30 seconds and 5 minutes, in 15 second steps', () => {
    expect(clampRestSeconds(90)).toBe(90)
    expect(clampRestSeconds(10)).toBe(30)
    expect(clampRestSeconds(400)).toBe(300)
    expect(clampRestSeconds(100)).toBe(105)
    expect(clampRestSeconds(Number.NaN)).toBe(90)
  })
})

describe('parseRestState', () => {
  it('restores a stored timer and rejects anything malformed', () => {
    expect(parseRestState(JSON.stringify(rest))).toEqual(rest)
    expect(parseRestState(null)).toBeNull()
    expect(parseRestState('{"startedAt":"x"}')).toBeNull()
    expect(parseRestState('not json')).toBeNull()
  })
})
