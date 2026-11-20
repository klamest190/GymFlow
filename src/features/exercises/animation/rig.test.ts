import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../../../data/exercises'
import { STAGE, projector, type Camera } from './camera'
import { EXERCISE_ANIMATIONS, partProgress, skeletonAt } from './poses'
import { LENGTH, add, distance, dot, normalize, reach, scale, seg, slerp, sub, type Vec3 } from './rig'
import { buildScene, handleAxis, scenePoints, stageLayout } from './scene'

describe('bicep curl', () => {
  const spec = EXERCISE_ANIMATIONS['bicep-curls']
  const at = (t: number) => {
    const skeleton = skeletonAt(spec, t)
    return { skeleton, axes: ([0, 1] as const).map((side) => handleAxis(spec, skeleton, side)!) }
  }

  it('starts in the neutral grip and ends supinated', () => {
    const bottom = at(0).axes
    const top = at(1).axes
    for (const side of [0, 1] as const) {
      // Neutral: the handle points forward (palms toward the thighs); supinated: across the body.
      expect(Math.abs(bottom[side][2])).toBeGreaterThan(0.95)
      expect(Math.abs(top[side][0])).toBeGreaterThan(0.95)
    }
  })

  it('keeps the handle across the forearm while the wrist turns, mirrored on both sides', () => {
    for (const t of STEPS) {
      const { skeleton, axes } = at(t)
      for (const side of [0, 1] as const) {
        const forearm = normalize(sub(skeleton.hands[side], skeleton.elbows[side]))
        expect(Math.abs(dot(axes[side], forearm))).toBeLessThan(1e-6)
      }
      expect(axes[0][0]).toBeCloseTo(-axes[1][0], 6)
      expect(axes[0][2]).toBeCloseTo(axes[1][2], 6)
    }
  })

  it('supinates outward: the thumb side swings away from the body', () => {
    const { axes } = at(0.25)
    // The handle end that led forward (thumb side) turns toward the +x outside on the +x hand.
    const thumbSide = axes[0][2] >= 0 ? axes[0] : scale(axes[0], -1)
    expect(thumbSide[0]).toBeGreaterThan(0.1)
  })
})

describe('part phases', () => {
  it('let a part lead and still cover the whole range', () => {
    const spec = EXERCISE_ANIMATIONS.crunches
    expect(partProgress(spec, 0)).toMatchObject({ head: 0, torso: 0 })
    expect(partProgress(spec, 1)).toMatchObject({ head: 1, torso: 1 })
    const middle = partProgress(spec, 0.4)
    expect(middle.head).toBeGreaterThan(middle.torso)
  })
})

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

  it('show the equipment the catalog names', () => {
    const shown = EXERCISES.map((exercise) => [exercise.id, EXERCISE_ANIMATIONS[exercise.id]?.equipment])
    const named = EXERCISES.map((exercise) => [exercise.id, exercise.equipment === 'dumbbell' ? 'dumbbells' : 'none'])
    expect(shown).toEqual(named)
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
