import { cameraFraming, orbitFraming, type Camera, type Framing, type ScenePoint } from './camera'
import { skeletonAt, type BodyPart, type ExerciseAnimationSpec } from './poses'
import { LENGTH, add, cross, dot, normalize, rotateAround, scale, type Skeleton, type Vec3 } from './rig'

/** Color roles; `ExerciseFigure` maps them to the --figure-* CSS tokens. */
export type Paint = 'body' | 'highlight' | 'soft' | 'gear' | 'ground'

/** Primitives in world space; `ExerciseFigure` projects, depth-sorts and draws them. */
export type Shape =
  | { kind: 'capsule'; a: Vec3; b: Vec3; radius: number; paint: Paint }
  | { kind: 'sphere'; center: Vec3; radius: number; paint: Paint }
  /** Convex volume given by points on its surface; `sheen` is a smaller copy for the light. */
  | { kind: 'hull'; points: Vec3[]; sheen: Vec3[]; paint: Paint; bias?: number }
  /** Short cylinder (weight plate, dumbbell head). */
  | { kind: 'disc'; center: Vec3; axis: Vec3; radius: number; thickness: number; paint: Paint }
  /** Axis-aligned box (bench pad). */
  | { kind: 'box'; min: Vec3; max: Vec3; paint: Paint }

export interface Scene {
  /** Furniture under the figure, drawn first and unsorted (the body always rests on top). */
  props: Shape[]
  /** Everything that moves, painted back to front. */
  body: Shape[]
}

const RADIUS = { neck: 3.8, upperArm: 4.6, forearm: 3.9, hand: 4.1, thigh: 6.2, shin: 4.8, foot: 3.2, deltoid: 6.6 }

/**
 * Torso cross-sections from the pelvis up: [height along the spine, half width, half depth,
 * shift toward the chest]. The lower three form the abs, the upper three the chest.
 */
const TORSO_SECTIONS = [
  [-4, 14, 8.5, 0],
  [15, 12.5, 8, 0.5],
  [25, 13.5, 8.5, 1],
  [36, 17, 10.5, 1.8],
  [47, 15.5, 8, 0],
] as const

const BENCH = { min: [-14, 33, -66] as Vec3, max: [14, 39, 26] as Vec3, legsZ: [-54, 14] }
const BAR = { halfLength: 64, plateAt: 47, plateRadius: 13, plateThickness: 5 }
const X: Vec3 = [1, 0, 0]

function ellipse(center: Vec3, a: Vec3, b: Vec3, ra: number, rb: number, steps = 12): Vec3[] {
  return Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2
    return add(center, add(scale(a, Math.cos(angle) * ra), scale(b, Math.sin(angle) * rb)))
  })
}

/** Chest and abs as two hulls, so either can light up; the twist blends from hips to shoulders. */
function torso(s: Skeleton, paint: (part: BodyPart) => Paint): Shape[] {
  const rings = TORSO_SECTIONS.map(([height, halfWidth, halfDepth, shift]) => {
    const lateral = rotateAround(s.pelvisLateral, s.spine, (-s.twist * Math.max(0, height)) / 47)
    const forward = cross(lateral, s.spine)
    const center = add(add(s.pelvis, scale(s.spine, height)), scale(forward, shift))
    return {
      outline: ellipse(center, lateral, forward, halfWidth, halfDepth),
      // Upper-front part of the section: where the light catches the body.
      sheen: ellipse(add(center, add(scale(forward, halfDepth * 0.45), scale(lateral, halfWidth * 0.15))), lateral, forward, halfWidth * 0.5, halfDepth * 0.4, 8),
    }
  })
  const hull = (from: number, to: number, part: BodyPart): Shape => ({
    kind: 'hull',
    points: rings.slice(from, to).flatMap((ring) => ring.outline),
    sheen: rings.slice(from, to).flatMap((ring) => ring.sheen),
    paint: paint(part),
    // Torso before limbs at equal depth: arms and legs should never vanish into the trunk.
    bias: -4,
  })
  return [hull(0, 3, 'abs'), hull(2, 5, 'chest')]
}

function barbell(s: Skeleton): Shape[] {
  const center = scale(add(s.hands[0], s.hands[1]), 0.5)
  const end = (sign: 1 | -1, at: number) => add(center, scale(X, sign * at))
  return [
    { kind: 'capsule', a: end(-1, BAR.halfLength), b: end(1, BAR.halfLength), radius: 1.5, paint: 'gear' },
    ...([1, -1] as const).map(
      (sign): Shape => ({ kind: 'disc', center: end(sign, BAR.plateAt), axis: X, radius: BAR.plateRadius, thickness: BAR.plateThickness, paint: 'gear' }),
    ),
  ]
}

function dumbbell(hand: Vec3, handle: Vec3): Shape[] {
  return [
    { kind: 'capsule', a: add(hand, scale(handle, -7)), b: add(hand, scale(handle, 7)), radius: 1.6, paint: 'gear' },
    ...([1, -1] as const).map((sign): Shape => ({ kind: 'disc', center: add(hand, scale(handle, sign * 7.5)), axis: handle, radius: 6, thickness: 4.5, paint: 'gear' })),
  ]
}

function bench(): Shape[] {
  const { min, max, legsZ } = BENCH
  return [
    ...legsZ.flatMap((z): Shape[] => [
      { kind: 'capsule', a: [0, min[1], z], b: [0, 1.5, z], radius: 2.6, paint: 'ground' },
      { kind: 'capsule', a: [-11, 1.5, z], b: [11, 1.5, z], radius: 2, paint: 'ground' },
    ]),
    { kind: 'box', min, max, paint: 'ground' },
  ]
}

export function buildScene(spec: ExerciseAnimationSpec, s: Skeleton): Scene {
  const { primary, secondary = [] } = spec.highlight
  const paint = (part: BodyPart): Paint => (primary.includes(part) ? 'highlight' : secondary.includes(part) ? 'soft' : 'body')
  const capsule = (a: Vec3, b: Vec3, radius: number, color: Paint): Shape => ({ kind: 'capsule', a, b, radius, paint: color })
  // Face direction: the chest's forward, made perpendicular to the head's own direction.
  const face = normalize(add(s.forward, scale(s.headDirection, -dot(s.forward, s.headDirection))))

  const body: Shape[] = [
    ...torso(s, paint),
    capsule(s.shoulderCenter, s.neck, RADIUS.neck, 'body'),
    { kind: 'sphere', center: s.head, radius: LENGTH.headRadius, paint: 'body' },
    // A small nose shows which way the head faces, which a plain ball can't.
    { kind: 'sphere', center: add(s.head, scale(face, LENGTH.headRadius * 0.92)), radius: 2.8, paint: 'body' },
  ]
  for (const side of [0, 1] as const) {
    body.push(
      capsule(s.hips[side], s.knees[side], RADIUS.thigh, paint('thighs')),
      capsule(s.knees[side], s.ankles[side], RADIUS.shin, 'body'),
      capsule(s.ankles[side], s.toes[side], RADIUS.foot, 'body'),
      { kind: 'sphere', center: s.shoulders[side], radius: RADIUS.deltoid, paint: paint('shoulders') },
      capsule(s.shoulders[side], s.elbows[side], RADIUS.upperArm, paint('upperArms')),
      capsule(s.elbows[side], s.hands[side], RADIUS.forearm, paint('forearms')),
      { kind: 'sphere', center: s.hands[side], radius: RADIUS.hand, paint: 'body' },
    )
    if (spec.equipment === 'dumbbells') body.push(...dumbbell(s.hands[side], spec.handle ?? X))
  }
  if (spec.equipment === 'barbell') body.push(...barbell(s))

  return { props: spec.ground === 'bench' ? bench() : [], body }
}

/** Every point the scene draws, with its drawn radius: what the camera framing must fit. */
export function scenePoints({ props, body }: Scene): ScenePoint[] {
  return [...props, ...body].flatMap((shape): ScenePoint[] => {
    switch (shape.kind) {
      case 'capsule':
        return [
          [shape.a, shape.radius],
          [shape.b, shape.radius],
        ]
      case 'sphere':
        return [[shape.center, shape.radius]]
      case 'hull':
        return shape.points.map((point) => [point, 0] as const)
      case 'disc':
        return [[shape.center, shape.radius]]
      case 'box':
        return [
          [shape.min, 0],
          [shape.max, 0],
        ]
    }
  })
}

export interface StageLayout {
  framing: Framing
  /** Round platform under the figure. */
  floor: { center: Vec3; radius: number }
}

const LAYOUT_SAMPLES = 9

/**
 * Framing over the whole repetition, so nothing leaves the stage mid-movement. With a fixed `camera`
 * it fits tightly for that angle; without, it fits every angle (free rotation).
 */
export function stageLayout(spec: ExerciseAnimationSpec, camera: Camera | null, fill: number): StageLayout {
  const points = Array.from({ length: LAYOUT_SAMPLES }, (_, index) =>
    scenePoints(buildScene(spec, skeletonAt(spec, index / (LAYOUT_SAMPLES - 1)))),
  ).flat()
  const framing = camera ? cameraFraming(points, camera, fill) : orbitFraming(points, fill)
  const center: Vec3 = [framing.center[0], 0, framing.center[2]]
  const reach = Math.max(...points.map(([point, radius]) => Math.hypot(point[0] - center[0], point[2] - center[2]) + radius))
  return { framing, floor: { center, radius: Math.max(48, reach + 12) } }
}
