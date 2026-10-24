import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../../../data/exercises'
import { EXERCISE_ANIMATIONS } from './poses'
import { LENGTH, interpolatePose, reach, solvePose, type Vec } from './rig'

const distance = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])

describe('exercise animations', () => {
  it('exist for every catalog exercise', () => {
    const missing = EXERCISES.filter((exercise) => !(exercise.id in EXERCISE_ANIMATIONS)).map((exercise) => exercise.id)
    expect(missing).toEqual([])
  })

  it('only animate exercises that exist', () => {
    const ids = new Set(EXERCISES.map((exercise) => exercise.id))
    expect(Object.keys(EXERCISE_ANIMATIONS).filter((id) => !ids.has(id))).toEqual([])
  })

  it.each(Object.entries(EXERCISE_ANIMATIONS))('%s keeps limbs at their length and inside the stage', (_, spec) => {
    for (let step = 0; step <= 10; step++) {
      const pose = interpolatePose(spec.from, spec.to, step / 10)
      const skeleton = solvePose(spec.setup, pose)
      const [upperScale, foreScale] = pose.armScale ?? [1, 1]
      for (const side of [0, 1] as const) {
        expect(distance(skeleton.shoulders[side], skeleton.elbows[side])).toBeCloseTo(LENGTH.upperArm * upperScale, 5)
        expect(distance(skeleton.elbows[side], skeleton.hands[side])).toBeCloseTo(LENGTH.forearm * foreScale, 5)
      }
      // Everything stays within the drawn area (viewBox plus a margin for stroke width).
      const [minX, minY, width, height] = (spec.viewBox ?? '0 0 200 200').split(' ').map(Number)
      for (const point of [skeleton.head, ...skeleton.hands, ...skeleton.toes]) {
        expect(point[0]).toBeGreaterThan(minX - 5)
        expect(point[0]).toBeLessThan(minX + width + 5)
        expect(point[1]).toBeGreaterThan(minY - 5)
        expect(point[1]).toBeLessThan(minY + height + 5)
      }
    }
  })
})

describe('reach (inverse kinematics)', () => {
  it('puts the hand on a reachable target', () => {
    const start: Vec = [100, 100]
    const target: Vec = [130, 70]
    for (const bend of [1, -1] as const) {
      const [upper, lower] = reach(start, target, 27, 25, bend)
      const elbow: Vec = [start[0] + Math.sin((upper * Math.PI) / 180) * 27, start[1] + Math.cos((upper * Math.PI) / 180) * 27]
      const hand: Vec = [elbow[0] + Math.sin((lower * Math.PI) / 180) * 25, elbow[1] + Math.cos((lower * Math.PI) / 180) * 25]
      expect(distance(hand, target)).toBeLessThan(0.01)
    }
  })

  it('stretches toward targets out of reach instead of failing', () => {
    const [upper, lower] = reach([0, 0], [0, -500], 27, 25, 1)
    expect(Number.isFinite(upper) && Number.isFinite(lower)).toBe(true)
  })
})
