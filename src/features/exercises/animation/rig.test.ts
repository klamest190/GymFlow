import { describe, expect, it } from 'vitest'
import { getExercises } from '../../../data/exercises'
import { STAGE, projector, type Camera } from './camera'
import { EXERCISE_ANIMATIONS, partProgress, skeletonAt } from './poses'
import { LENGTH, add, distance, dot, normalize, reach, scale, seg, slerp, sub, type Vec3 } from './rig'
import { buildScene, handleAxis, scenePoints, stageLayout, type Shape } from './scene'

const EXERCISES = getExercises('de')

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

describe('new movement details', () => {
  const rolling = Object.entries(EXERCISE_ANIMATIONS).filter(([, spec]) => spec.from.forearmRoll !== undefined)

  it.each(rolling)('%s never points a forearm along the shoulder axis (the grip stays defined)', (_, spec) => {
    for (const t of STEPS) {
      const skeleton = skeletonAt(spec, t)
      for (const side of [0, 1] as const) {
        const forearm = normalize(sub(skeleton.hands[side], skeleton.elbows[side]))
        const outward = side === 0 ? skeleton.lateral : scale(skeleton.lateral, -1)
        expect(Math.abs(dot(forearm, outward))).toBeLessThan(0.9)
      }
    }
  })

  it('calf raises lift the heels while the balls of the feet stay put', () => {
    const spec = EXERCISE_ANIMATIONS['calf-raises']
    const start = skeletonAt(spec, 0)
    for (const t of STEPS) {
      const skeleton = skeletonAt(spec, t)
      for (const side of [0, 1] as const) expect(distance(skeleton.toes[side], start.toes[side])).toBeLessThan(1)
    }
    expect(skeletonAt(spec, 1).ankles[0][1] - start.ankles[0][1]).toBeGreaterThan(6)
  })

  it('Romanian deadlifts keep the dumbbells on the legs', () => {
    const spec = EXERCISE_ANIMATIONS['romanian-deadlift']
    for (const t of STEPS) {
      const s = skeletonAt(spec, t)
      for (const side of [0, 1] as const) {
        const along = normalize(sub(s.knees[side], s.hips[side]))
        const offset = sub(s.hands[side], s.hips[side])
        const fromLine = sub(offset, scale(along, Math.min(LENGTH.thigh, Math.max(0, dot(offset, along)))))
        // Thigh radius plus hand radius (10.3), with a little air.
        expect(Math.hypot(...fromLine)).toBeLessThan(11)
      }
    }
  })

  it('rows end with the hand beside the hip, the elbow behind the back', () => {
    for (const id of ['bent-over-row', 'one-arm-dumbbell-row']) {
      const s = skeletonAt(EXERCISE_ANIMATIONS[id], 1)
      const elbow = sub(s.elbows[1], s.shoulderCenter)
      const hand = sub(s.hands[1], s.pelvis)
      expect(dot(elbow, s.forward), id).toBeLessThan(0)
      expect(dot(hand, s.spine), id).toBeLessThan(20)
    }
  })

  it.each(['push-ups', 'diamond-push-ups', 'pike-push-ups'])('%s keep the hands and toes planted', (id) => {
    const spec = EXERCISE_ANIMATIONS[id]
    const start = skeletonAt(spec, 0)
    for (const t of STEPS) {
      const s = skeletonAt(spec, t)
      for (const side of [0, 1] as const) {
        expect(distance(s.hands[side], start.hands[side])).toBeLessThan(0.5)
        expect(distance(s.toes[side], start.toes[side])).toBeLessThan(0.5)
      }
    }
    expect(start.hands[0][1]).toBeLessThan(5)
  })

  it('push-ups lower the chest close to the floor, the body staying one line', () => {
    const spec = EXERCISE_ANIMATIONS['push-ups']
    const top = skeletonAt(spec, 0)
    const bottom = skeletonAt(spec, 1)
    expect(top.shoulderCenter[1] - bottom.shoulderCenter[1]).toBeGreaterThan(25)
    for (const s of [top, bottom]) {
      // Hips on the line from the ankles to the shoulders: no sagging, no piking.
      const line = normalize(sub(s.shoulderCenter, s.ankles[0]))
      const hip = sub(s.pelvis, s.ankles[0])
      expect(Math.abs(hip[1] - line[1] * dot(hip, line))).toBeLessThan(1)
    }
  })

  it('Bulgarian split squats keep the rear foot on the bench and lower the rear knee', () => {
    const spec = EXERCISE_ANIMATIONS['bulgarian-split-squat']
    const start = skeletonAt(spec, 0)
    for (const t of STEPS) {
      const s = skeletonAt(spec, t)
      expect(distance(s.ankles[1], start.ankles[1])).toBeLessThan(0.5)
      expect(distance(s.ankles[0], start.ankles[0])).toBeLessThan(0.5)
    }
    expect(start.ankles[1][1]).toBeGreaterThan(39)
    expect(skeletonAt(spec, 1).knees[1][1]).toBeLessThan(20)
  })

  it('thrusters keep both feet planted and finish with the dumbbells overhead', () => {
    const spec = EXERCISE_ANIMATIONS.thrusters
    const start = skeletonAt(spec, 0)
    for (const t of STEPS) {
      const s = skeletonAt(spec, t)
      for (const side of [0, 1] as const) expect(distance(s.ankles[side], start.ankles[side])).toBeLessThan(0.5)
    }
    const top = skeletonAt(spec, 1)
    for (const side of [0, 1] as const) expect(top.hands[side][1]).toBeGreaterThan(top.head[1] + 20)
  })

  it('renegade rows keep the supporting dumbbell on the floor while the other rows to the ribs', () => {
    const spec = EXERCISE_ANIMATIONS['renegade-rows']
    const top = skeletonAt(spec, 1)
    expect(top.hands[0][1]).toBeCloseTo(skeletonAt(spec, 0).hands[0][1], 5)
    const elbow = sub(top.elbows[1], top.shoulderCenter)
    expect(dot(elbow, top.forward)).toBeLessThan(0)
    expect(top.hands[1][1]).toBeGreaterThan(30)
  })

  it('only splits the torso into front and back when the back works', () => {
    const torsoHulls = (id: string) => {
      const count = (shape: Shape): number => (shape.kind === 'hull' ? 1 : shape.kind === 'seam' ? count(shape.shapes[0]) + count(shape.shapes[1]) : 0)
      const spec = EXERCISE_ANIMATIONS[id]
      return count(buildScene(spec, skeletonAt(spec, 0)).body[0])
    }
    expect(torsoHulls('bent-over-row')).toBe(4)
    expect(torsoHulls('romanian-deadlift')).toBe(4)
    expect(torsoHulls('bicep-curls')).toBe(2)
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
