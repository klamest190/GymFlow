/**
 * A small 3D skeleton for the exercise animations, drawn through a virtual camera (`camera.ts`).
 * Poses are segment directions, not coordinates: interpolating directions (slerp) keeps every
 * limb at its length, so movements look natural instead of rubbery.
 *
 * World space: y up, floor at y = 0, the figure faces +z. Side index 0 is the +x side.
 */

export type Vec3 = readonly [number, number, number]
export type Side = 0 | 1

/**
 * Directions of the upper and lower segment (upper arm/forearm, thigh/shin). Side-relative:
 * +x points outward, away from the body, on either side.
 */
export type Limb = readonly [upper: Vec3, lower: Vec3]

export interface Pose {
  /** Position of the rig's root joint (see `RigSetup.root`), which stays fixed in place. */
  root: Vec3
  /** Hip → shoulder direction. */
  torso: Vec3
  /** Rotation of the shoulders around the spine in degrees; positive turns the +x shoulder forward. */
  twist?: number
  /** Shoulder → head direction. */
  head: Vec3
  arms: readonly [Limb, Limb]
  legs: readonly [Limb, Limb]
  /** Ankle → toe directions (side-relative); default flat, pointing forward. */
  feet?: readonly [Vec3, Vec3]
}

export interface RigSetup {
  /** The joint that stays put: the +x ankle when standing, the pelvis when lying or sitting. */
  root: 'ankle' | 'pelvis'
}

export interface Skeleton {
  head: Vec3
  neck: Vec3
  shoulderCenter: Vec3
  pelvis: Vec3
  /** Torso frame: up the spine, toward the +x shoulder, out of the chest. */
  spine: Vec3
  lateral: Vec3
  forward: Vec3
  /** Lateral axis at the hips, before the twist (the torso shape blends between the two). */
  pelvisLateral: Vec3
  twist: number
  /** Shoulder → head direction. */
  headDirection: Vec3
  shoulders: [Vec3, Vec3]
  elbows: [Vec3, Vec3]
  hands: [Vec3, Vec3]
  hips: [Vec3, Vec3]
  knees: [Vec3, Vec3]
  ankles: [Vec3, Vec3]
  toes: [Vec3, Vec3]
}

export const LENGTH = { torso: 50, neck: 8, headRadius: 10, upperArm: 27, forearm: 25, thigh: 36, shin: 35, foot: 10 }
export const SHOULDER_HALF_WIDTH = 15
export const HIP_HALF_WIDTH = 8

const X: Vec3 = [1, 0, 0]

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: Vec3, factor: number): Vec3 => [a[0] * factor, a[1] * factor, a[2] * factor]
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
export const normalize = (a: Vec3): Vec3 => scale(a, 1 / (length(a) || 1))
export const distance = (a: Vec3, b: Vec3) => length(sub(a, b))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const radians = (degrees: number) => (degrees * Math.PI) / 180

/**
 * Direction from two angles in degrees: `flex` swings forward in the body's side plane
 * (0 = down, 90 = forward, 180 = up, -90 = back), then `out` tilts it to the side (90 = straight
 * out). In limbs, positive `out` points away from the body on either side; for the torso and
 * head it leans toward +x.
 */
export const seg = (flex: number, out = 0): Vec3 => {
  const f = radians(flex)
  const o = radians(out)
  return [Math.sin(o), -Math.cos(f) * Math.cos(o), Math.sin(f) * Math.cos(o)]
}

type Angles = number | readonly [flex: number, out: number]
const toDirection = (angles: Angles) => (typeof angles === 'number' ? seg(angles) : seg(angles[0], angles[1]))
export const limb = (upper: Angles, lower: Angles): Limb => [toDirection(upper), toDirection(lower)]

/** Side-relative ↔ world (the mapping is its own inverse: it flips x on the -x side). */
export const sided = (direction: Vec3, side: Side): Vec3 => (side === 0 ? direction : [-direction[0], direction[1], direction[2]])

/** Rodrigues' rotation of `v` around the unit `axis`. */
export function rotateAround(v: Vec3, axis: Vec3, degrees: number): Vec3 {
  const angle = radians(degrees)
  const cos = Math.cos(angle)
  return add(add(scale(v, cos), scale(cross(axis, v), Math.sin(angle))), scale(axis, dot(axis, v) * (1 - cos)))
}

/** Interpolates two unit directions along the great circle, i.e. the short way round. */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const angle = Math.acos(Math.min(1, Math.max(-1, dot(a, b))))
  const sin = Math.sin(angle)
  if (sin < 1e-4) return normalize(lerp3(a, b, t))
  return add(scale(a, Math.sin((1 - t) * angle) / sin), scale(b, Math.sin(t * angle) / sin))
}

const slerpLimb = (a: Limb, b: Limb, t: number): Limb => [slerp(a[0], b[0], t), slerp(a[1], b[1], t)]
const slerpPair = (a: readonly [Vec3, Vec3], b: readonly [Vec3, Vec3], t: number) => [slerp(a[0], b[0], t), slerp(a[1], b[1], t)] as const
const FLAT_FEET = [seg(90, 10), seg(90, 10)] as const

export function interpolatePose(from: Pose, to: Pose, t: number): Pose {
  return {
    root: lerp3(from.root, to.root, t),
    torso: slerp(from.torso, to.torso, t),
    twist: lerp(from.twist ?? 0, to.twist ?? 0, t),
    head: slerp(from.head, to.head, t),
    arms: [slerpLimb(from.arms[0], to.arms[0], t), slerpLimb(from.arms[1], to.arms[1], t)],
    legs: [slerpLimb(from.legs[0], to.legs[0], t), slerpLimb(from.legs[1], to.legs[1], t)],
    feet: slerpPair(from.feet ?? FLAT_FEET, to.feet ?? FLAT_FEET, t),
  }
}

function limbChain(start: Vec3, limb: Limb, side: Side, upperLength: number, lowerLength: number): [Vec3, Vec3] {
  const middle = add(start, scale(sided(limb[0], side), upperLength))
  return [middle, add(middle, scale(sided(limb[1], side), lowerLength))]
}

/** Forward kinematics: joint positions for a pose. */
export function solvePose(setup: RigSetup, pose: Pose): Skeleton {
  const hipOffset = (side: Side) => scale(X, side === 0 ? HIP_HALF_WIDTH : -HIP_HALF_WIDTH)

  let pelvis: Vec3
  if (setup.root === 'ankle') {
    // Walk up the +x leg from the planted foot.
    const knee = sub(pose.root, scale(sided(pose.legs[0][1], 0), LENGTH.shin))
    const hip = sub(knee, scale(sided(pose.legs[0][0], 0), LENGTH.thigh))
    pelvis = sub(hip, hipOffset(0))
  } else {
    pelvis = pose.root
  }

  const spine = normalize(pose.torso)
  const twist = pose.twist ?? 0
  const pelvisLateral = normalize(sub(X, scale(spine, dot(X, spine))))
  // Positive twist turns the +x shoulder forward (toward +z when upright).
  const lateral = rotateAround(pelvisLateral, spine, -twist)
  const forward = cross(lateral, spine)

  const hips: [Vec3, Vec3] = [add(pelvis, hipOffset(0)), add(pelvis, hipOffset(1))]
  const legs = ([0, 1] as const).map((side) => limbChain(hips[side], pose.legs[side], side, LENGTH.thigh, LENGTH.shin))
  const feet = pose.feet ?? FLAT_FEET
  const ankles: [Vec3, Vec3] = [legs[0][1], legs[1][1]]
  const toes: [Vec3, Vec3] = [
    add(ankles[0], scale(sided(feet[0], 0), LENGTH.foot)),
    add(ankles[1], scale(sided(feet[1], 1), LENGTH.foot)),
  ]

  const shoulderCenter = add(pelvis, scale(spine, LENGTH.torso))
  const shoulders: [Vec3, Vec3] = [
    add(shoulderCenter, scale(lateral, SHOULDER_HALF_WIDTH)),
    add(shoulderCenter, scale(lateral, -SHOULDER_HALF_WIDTH)),
  ]
  const arms = ([0, 1] as const).map((side) => limbChain(shoulders[side], pose.arms[side], side, LENGTH.upperArm, LENGTH.forearm))
  const headDirection = normalize(pose.head)

  return {
    head: add(shoulderCenter, scale(headDirection, LENGTH.neck + LENGTH.headRadius)),
    neck: add(shoulderCenter, scale(headDirection, LENGTH.neck)),
    shoulderCenter,
    pelvis,
    spine,
    lateral,
    forward,
    pelvisLateral,
    twist,
    headDirection,
    shoulders,
    elbows: [arms[0][0], arms[1][0]],
    hands: [arms[0][1], arms[1][1]],
    hips,
    knees: [legs[0][0], legs[1][0]],
    ankles,
    toes,
  }
}

/**
 * Two-bone inverse kinematics: the world directions that put the end of a chain starting at
 * `start` onto `target`. The middle joint (elbow/knee) bends toward `pole`.
 */
export function reach(start: Vec3, target: Vec3, upperLength: number, lowerLength: number, pole: Vec3): Limb {
  const delta = sub(target, start)
  const span = Math.min(Math.max(length(delta), Math.abs(upperLength - lowerLength) + 0.01), upperLength + lowerLength - 0.01)
  const axis = normalize(delta)
  const cos = (upperLength ** 2 + span ** 2 - lowerLength ** 2) / (2 * upperLength * span)
  const bend = normalize(sub(pole, scale(axis, dot(pole, axis))))
  const middle = add(start, add(scale(axis, cos * upperLength), scale(bend, Math.sqrt(1 - cos ** 2) * upperLength)))
  const end = add(start, scale(axis, span))
  return [normalize(sub(middle, start)), normalize(sub(end, middle))]
}

/**
 * Returns `pose` with both arms solved so the hands land on `targets` (+x side first); the
 * elbows bend toward the side-relative `poles`.
 */
export function withHands(setup: RigSetup, pose: Pose, targets: readonly [Vec3, Vec3], poles: readonly [Vec3, Vec3]): Pose {
  const { shoulders } = solvePose(setup, pose)
  const arm = (side: Side): Limb => {
    const [upper, lower] = reach(shoulders[side], targets[side], LENGTH.upperArm, LENGTH.forearm, sided(poles[side], side))
    return [sided(upper, side), sided(lower, side)]
  }
  return { ...pose, arms: [arm(0), arm(1)] }
}
