import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../../../data/exercises'
import { STAGE, projector, type Camera } from './camera'
import { EXERCISE_ANIMATIONS, skeletonAt } from './poses'
import { LENGTH, add, distance, reach, scale, seg, slerp, type Vec3 } from './rig'
import { buildScene, scenePoints, stageLayout } from './scene'

const STEPS = Array.from({ length: 11 }, (_, index) => index / 10)

/** Every drawn point of the scene lies on the stage (with a small margin for anti-aliasing). */
function expectOnStage(spec: (typeof EXERCISE_ANIMATIONS)[string], camera: Camera, orbit: boolean) {
  const project = projector(camera, stageLayout(spec, orbit ? null : camera, orbit ? 1 : 0.88).framing)
  for (const t of STEPS) {
    for (const [point, radius] of scenePoints(buildScene(spec, skeletonAt(spec, t)))) {
      const { x, y, scale: size } = project(point)
      expect(x - radius * size).toBeGreaterThan(-1)
      expect(x + radius * size).toBeLessThan(STAGE + 1)
      expect(y - radius * size).toBeGreaterThan(-1)
      expect(y + radius * size).toBeLessThan(STAGE + 1)
    }
  }
}

describe('exercise animations', () => {
  it('exist for every catalog exercise', () => {
    const missing = EXERCISES.filter((exercise) => !(exercise.id in EXERCISE_ANIMATIONS)).map((exercise) => exercise.id)
    expect(missing).toEqual([])
  })

  it('only animate exercises that exist', () => {
    const ids = new Set(EXERCISES.map((exercise) => exercise.id))
    expect(Object.keys(EXERCISE_ANIMATIONS).filter((id) => !ids.has(id))).toEqual([])
  })

  it.each(Object.entries(EXERCISE_ANIMATIONS))('%s keeps limbs at their length', (_, spec) => {
    for (const t of STEPS) {
      const skeleton = skeletonAt(spec, t)
      for (const side of [0, 1] as const) {
        expect(distance(skeleton.shoulders[side], skeleton.elbows[side])).toBeCloseTo(LENGTH.upperArm, 5)
        expect(distance(skeleton.elbows[side], skeleton.hands[side])).toBeCloseTo(LENGTH.forearm, 5)
        expect(distance(skeleton.hips[side], skeleton.knees[side])).toBeCloseTo(LENGTH.thigh, 5)
        expect(distance(skeleton.knees[side], skeleton.ankles[side])).toBeCloseTo(LENGTH.shin, 5)
      }
    }
  })

  it.each(Object.entries(EXERCISE_ANIMATIONS))('%s stays on the stage, also when turned', (_, spec) => {
    expectOnStage(spec, spec.camera, false)
    for (const yaw of [0, 60, 120, 180, 240, 300]) expectOnStage(spec, { ...spec.camera, yaw }, true)
  })

  it.each(Object.entries(EXERCISE_ANIMATIONS))('%s keeps the body above the floor', (_, spec) => {
    for (const t of STEPS) {
      const skeleton = skeletonAt(spec, t)
      for (const point of [skeleton.head, ...skeleton.hands, ...skeleton.knees, ...skeleton.ankles, ...skeleton.toes]) {
        expect(point[1]).toBeGreaterThan(-1)
      }
    }
  })
})

describe('reach (inverse kinematics)', () => {
  const start: Vec3 = [0, 100, 0]

  it('puts the hand on a reachable target, bending toward the pole', () => {
    const target: Vec3 = [20, 120, 25]
    const pole: Vec3 = [1, -1, 0]
    const [upper, lower] = reach(start, target, 27, 25, pole)
    const elbow = add(start, scale(upper, 27))
    expect(distance(add(elbow, scale(lower, 25)), target)).toBeLessThan(0.01)
    // The elbow sits on the pole's side of the shoulder → hand line.
    const middle = scale(add(start, target), 0.5)
    expect(elbow[0] - middle[0]).toBeGreaterThan(0)
  })

  it('stretches toward targets out of reach instead of failing', () => {
    const [upper, lower] = reach(start, [0, -500, 0], 27, 25, [1, 0, 0])
    expect([...upper, ...lower].every(Number.isFinite)).toBe(true)
  })
})

describe('slerp', () => {
  it('keeps directions at unit length and takes the short way', () => {
    const down = seg(0)
    const forward = seg(90)
    const half = slerp(down, forward, 0.5)
    expect(Math.hypot(...half)).toBeCloseTo(1, 10)
    expect(half[1]).toBeLessThan(0)
    expect(half[2]).toBeGreaterThan(0)
  })
})
