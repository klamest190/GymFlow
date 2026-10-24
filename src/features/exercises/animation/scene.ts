import { cameraFraming, orbitFraming, type Camera, type Framing, type ScenePoint } from './camera'
import { skeletonAt, type BodyPart, type ExerciseAnimationSpec } from './poses'
import { LENGTH, add, cross, dot, normalize, rotateAround, scale, type Skeleton, type Vec3 } from './rig'

/** Color roles; `ExerciseFigure` maps them to the --figure-* CSS tokens. */
export type Paint = 'body' | 'highlight' | 'soft' | 'gear' | 'ground'

/**
 * How a capsule ends: rounded (default), `attached` (cut flat without outline where it leaves
 * the torso, so it covers as little of the trunk as possible), or a joint shared with the next
 * segment of the limb. A joint is split between the two segments without overlap, so it looks the
 * same whichever segment is painted last; the `owner` also fills the rounded outside of the bend.
 */
export type CapsuleEnd = 'attached' | { joint: Vec3; radius: number; owner?: boolean }

/** Primitives in world space; `ExerciseFigure` projects, depth-sorts and draws them. */
export type Shape =
  | { kind: 'capsule'; a: Vec3; b: Vec3; radius: number; paint: Paint; start?: CapsuleEnd; end?: CapsuleEnd }
  /** `bias` moves it in the painting order without moving it (a hand on its dumbbell handle). */
  | { kind: 'sphere'; center: Vec3; radius: number; paint: Paint; bias?: number }
  /** Convex volume given by points on its surface; `sheen` is a smaller copy for the light. */
  | { kind: 'hull'; points: Vec3[]; sheen: Vec3[]; paint: Paint; bias?: number }
  /** Short cylinder (weight plate, dumbbell head). */
  | { kind: 'disc'; center: Vec3; axis: Vec3; radius: number; thickness: number; paint: Paint }
  /** Axis-aligned box (bench pad). */
  | { kind: 'box'; min: Vec3; max: Vec3; paint: Paint }
  /**
   * Parts that always stay together in the painting order, at the depth of the first one. Drawn
   * in the given order, or back to front among themselves when `sorted`.
   */
  | { kind: 'group'; shapes: Shape[]; sorted?: boolean }
  /**
   * Two touching parts, each sorted on its own, of which one always covers the other: the one on
   * the camera's side of the plane they meet at (through `at`, `normal` pointing from the first
   * into the second), or always the second without a plane.
   */
  | { kind: 'seam'; shapes: readonly [Shape, Shape]; plane?: { at: Vec3; normal: Vec3 } }

export interface Scene {
  /** Furniture under the figure, drawn first and unsorted (the body always rests on top). */
  props: Shape[]
  /** Everything that moves, painted back to front. */
  body: Shape[]
  /**
   * The spine as a line (pelvis, direction). The body is painted by depth around this axis: how far
   * a part sticks out toward the camera, not how high it sits. Otherwise a tilted camera would
   * rank an arm hanging beside the chest behind it only for being lower.
   */
  axis: { origin: Vec3; direction: Vec3 }
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
/** A small (about 5 kg) dumbbell: head distance from the hand, head size. */
const DUMBBELL = { headAt: 6.5, headRadius: 5, headThickness: 5 }
const SIDEWAYS: Vec3 = [1, 0, 0]

function ellipse(center: Vec3, a: Vec3, b: Vec3, ra: number, rb: number, steps = 12): Vec3[] {
  return Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2
    return add(center, add(scale(a, Math.cos(angle) * ra), scale(b, Math.sin(angle) * rb)))
  })
}

/** Chest and abs as two hulls, so either can light up; the twist blends from hips to shoulders. */
function torso(s: Skeleton, paint: (part: BodyPart) => Paint): Shape {
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
  // The halves share the middle section; whichever side of it faces the camera covers it.
  const [middle] = TORSO_SECTIONS[2]
  return { kind: 'seam', shapes: [hull(0, 3, 'abs'), hull(2, 5, 'chest')], plane: { at: add(s.pelvis, scale(s.spine, middle)), normal: s.spine } }
}

/**
 * The hand, holding a dumbbell when `handle` is given (torso frame [outward, up the spine, out of
 * the chest]). The hand sits on the handle, which is exactly as deep: the bias keeps it on top.
 */
function hand(s: Skeleton, side: 0 | 1, handle: Vec3 | null): Shape {
  const center = s.hands[side]
  const fist: Shape = { kind: 'sphere', center, radius: RADIUS.hand, paint: 'body', bias: 1 }
  if (!handle) return fist
  const [outward, up, out] = handle
  const lateral = side === 0 ? s.lateral : scale(s.lateral, -1)
  const axis = normalize(add(add(scale(lateral, outward), scale(s.spine, up)), scale(s.forward, out)))
  const { headAt, headRadius, headThickness } = DUMBBELL
  const heads = ([1, -1] as const).map(
    (sign): Shape => ({ kind: 'disc', center: add(center, scale(axis, sign * headAt)), axis, radius: headRadius, thickness: headThickness, paint: 'gear' }),
  )
  const bar: Shape = { kind: 'capsule', a: add(center, scale(axis, -headAt)), b: add(center, scale(axis, headAt)), radius: 1.5, paint: 'gear' }
  return { kind: 'group', shapes: [bar, ...heads, fist], sorted: true }
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
  const capsule = (a: Vec3, b: Vec3, radius: number, color: Paint, start?: CapsuleEnd, end?: CapsuleEnd): Shape => ({
    kind: 'capsule',
    a,
    b,
    radius,
    paint: color,
    start,
    end,
  })
  // Face direction: the chest's forward, made perpendicular to the head's own direction.
  const face = normalize(add(s.forward, scale(s.headDirection, -dot(s.forward, s.headDirection))))
  const handle = spec.equipment === 'dumbbells' ? (spec.handle ?? SIDEWAYS) : null

  const body: Shape[] = [
    torso(s, paint),
    // The head always covers the top of the neck.
    { kind: 'group', shapes: [capsule(s.shoulderCenter, s.neck, RADIUS.neck, 'body', 'attached'), { kind: 'sphere', center: s.head, radius: LENGTH.headRadius, paint: 'body' }] },
    // A small nose shows which way the head faces, which a plain ball can't.
    { kind: 'sphere', center: add(s.head, scale(face, LENGTH.headRadius * 0.92)), radius: 2.8, paint: 'body' },
  ]
  for (const side of [0, 1] as const) {
    const [hip, knee, ankle, toe] = [s.hips[side], s.knees[side], s.ankles[side], s.toes[side]]
    const [shoulder, elbow, wrist] = [s.shoulders[side], s.elbows[side], s.hands[side]]
    body.push(
      capsule(hip, knee, RADIUS.thigh, paint('thighs'), 'attached', { joint: ankle, radius: RADIUS.shin, owner: true }),
      capsule(knee, ankle, RADIUS.shin, 'body', { joint: hip, radius: RADIUS.thigh }, { joint: toe, radius: RADIUS.foot, owner: true }),
      capsule(ankle, toe, RADIUS.foot, 'body', { joint: knee, radius: RADIUS.shin }),
      // The deltoid sits on the torso's corner: it goes by its own depth (so it doesn't dive behind the
      // chest whenever the arm swings back) but always caps its upper arm.
      {
        kind: 'seam',
        shapes: [
          capsule(shoulder, elbow, RADIUS.upperArm, paint('upperArms'), 'attached', { joint: wrist, radius: RADIUS.forearm, owner: true }),
          { kind: 'sphere', center: shoulder, radius: RADIUS.deltoid, paint: paint('shoulders') },
        ],
      },
      // The hand (and dumbbell) ends the forearm.
      {
        kind: 'group',
        shapes: [capsule(elbow, wrist, RADIUS.forearm, paint('forearms'), { joint: shoulder, radius: RADIUS.upperArm }), hand(s, side, handle)],
      },
    )
  }

  return { props: spec.ground === 'bench' ? bench() : [], body, axis: { origin: s.pelvis, direction: s.spine } }
}

/** Every point the scene draws, with its drawn radius: what the camera framing must fit. */
export function scenePoints({ props, body }: Pick<Scene, 'props' | 'body'>): ScenePoint[] {
  return [...props, ...body].flatMap((shape): ScenePoint[] => {
    switch (shape.kind) {
      case 'group':
      case 'seam':
        return scenePoints({ props: [], body: [...shape.shapes] })
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
