import { describe, expect, it } from 'vitest'
import {
  completedReps,
  COUNTDOWN_SECONDS,
  DEFAULT_TEMPO,
  parseTempo,
  waveHeight,
  waveMoment,
  wavePath,
  waveSeconds,
  type WavePlan,
} from './tempoWave'

const plan: WavePlan = { tempo: { liftSeconds: 2, lowerSeconds: 4 }, reps: 3, lowersFirst: false }
const lowering: WavePlan = { ...plan, lowersFirst: true }
const afterCountdown = (seconds: number) => (COUNTDOWN_SECONDS + seconds) * 1000

describe('waveHeight', () => {
  it('lifts for the lift time and lowers for the lower time', () => {
    expect(waveHeight(plan, 0)).toBe(0)
    expect(waveHeight(plan, 1)).toBeCloseTo(0.5)
    expect(waveHeight(plan, 2)).toBeCloseTo(1)
    expect(waveHeight(plan, 4)).toBeCloseTo(0.5)
    expect(waveHeight(plan, 6)).toBeCloseTo(0)
  })

  it('repeats for every repetition', () => {
    expect(waveHeight(plan, 6 + 2)).toBeCloseTo(1)
    expect(waveHeight(plan, 12 + 1)).toBeCloseTo(0.5)
  })

  it('rests in the starting position before and after the set', () => {
    expect(waveHeight(plan, -3)).toBe(0)
    expect(waveHeight(plan, waveSeconds(plan) + 1)).toBe(0)
    expect(waveHeight(lowering, -3)).toBe(1)
    expect(waveHeight(lowering, waveSeconds(lowering))).toBe(1)
  })

  it('starts at the top and lowers first when the movement does', () => {
    expect(waveHeight(lowering, 2)).toBeCloseTo(0.5)
    expect(waveHeight(lowering, 4)).toBeCloseTo(0)
    expect(waveHeight(lowering, 5)).toBeCloseTo(0.5)
  })
})

describe('waveMoment', () => {
  it('counts down from 5 before the first repetition', () => {
    expect(waveMoment(plan, 0)).toEqual({ phase: 'countdown', secondsLeft: 5 })
    expect(waveMoment(plan, 4100)).toEqual({ phase: 'countdown', secondsLeft: 1 })
  })

  it('names the phase and the repetition', () => {
    expect(waveMoment(plan, afterCountdown(0))).toEqual({ phase: 'lift', rep: 1 })
    expect(waveMoment(plan, afterCountdown(2))).toEqual({ phase: 'lower', rep: 1 })
    expect(waveMoment(plan, afterCountdown(6))).toEqual({ phase: 'lift', rep: 2 })
    expect(waveMoment(lowering, afterCountdown(0))).toEqual({ phase: 'lower', rep: 1 })
    expect(waveMoment(lowering, afterCountdown(4))).toEqual({ phase: 'lift', rep: 1 })
  })

  it('is done after the last repetition', () => {
    expect(waveMoment(plan, afterCountdown(17.9))).toEqual({ phase: 'lower', rep: 3 })
    expect(waveMoment(plan, afterCountdown(18))).toEqual({ phase: 'done' })
  })
})

describe('completedReps', () => {
  it('counts only finished repetitions, up to the planned number', () => {
    expect(completedReps(plan, 2000)).toBe(0)
    expect(completedReps(plan, afterCountdown(5.9))).toBe(0)
    expect(completedReps(plan, afterCountdown(6))).toBe(1)
    expect(completedReps(plan, afterCountdown(100))).toBe(3)
  })
})

describe('parseTempo', () => {
  it('falls back to the default for missing or broken values', () => {
    expect(parseTempo(null)).toEqual(DEFAULT_TEMPO)
    expect(parseTempo('nope')).toEqual(DEFAULT_TEMPO)
    expect(parseTempo('null')).toEqual(DEFAULT_TEMPO)
  })

  it('keeps stored seconds within 1 to 6', () => {
    expect(parseTempo('{"liftSeconds":3,"lowerSeconds":40}')).toEqual({ liftSeconds: 3, lowerSeconds: 6 })
    expect(parseTempo('{"liftSeconds":0}')).toEqual({ liftSeconds: 1, lowerSeconds: DEFAULT_TEMPO.lowerSeconds })
  })
})

describe('wavePath', () => {
  it('draws from the first to the last moment', () => {
    const path = wavePath(plan, { pxPerSecond: 40, top: 10, bottom: 90 }, -1, 2)
    expect(path.startsWith('M-40.0 90.0')).toBe(true)
    expect(path).toContain('L80.0 10.0')
  })
})
