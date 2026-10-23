/**
 * A tiny 2D skeleton for the exercise animations. Poses are joint angles, not coordinates:
 * interpolating angles keeps every limb at its length, so movements look natural instead of
 * rubbery. Coordinates live in a 200 × 200 viewBox, y pointing down.
 */

export type Vec = readonly [number, number]

/**
 * Absolute angles in degrees of the upper and lower segment (upper arm/forearm, thigh/shin):
 * 0 = pointing down, 90 = pointing right (+x, where side-view figures face), 180 = up.
 */
export type Limb = readonly [upper: number, lower: number]

/**
 * - `side`: profile facing right; index 0 = near limbs, 1 = far limbs (drawn fainter).
 * - `front`: facing the viewer; index 0 = right side of the screen, 1 = left.
 * - `end`: lying on a bench, seen from the feet; only chest, head and arms.
 */
export type View = 'side' | 'front' | 'end'

export interface Pose {
  /** Position of the rig's root joint (see `RigSetup.root`), which stays fixed in place. */
  root: Vec
  /** Hip → shoulder direction (side/front view). */
  torso: number
  /** Shoulder → head direction. */
  head: number
  arms: readonly [Limb, Limb]
  legs: readonly [Limb, Limb]
  /** Length factors for segments pointing toward the viewer (foreshortening): [upper, lower]. */
  armScale?: readonly [number, number]
  legScale?: readonly [number, number]
  /** Absolute foot angles (side view); default 90 = flat, pointing forward. */
  feet?: readonly [number, number]
}

export interface RigSetup {
  view: View
  /** The joint that stays put: the near/right ankle when standing, the pelvis when lying or sitting. */
  root: 'ankle' | 'pelvis' | 'chest'
}

export interface Skeleton {
  view: View
  head: Vec
  neck: Vec
  shoulderCenter: Vec
  /** Halfway between pelvis and shoulders: splits chest and abs. */
  midTorso: Vec
  pelvis: Vec
  torsoAngle: number
  shoulders: [Vec, Vec]
  elbows: [Vec, Vec]
  hands: [Vec, Vec]
  hips: [Vec, Vec]
  knees: [Vec, Vec]
  ankles: [Vec, Vec]
  toes: [Vec, Vec]
}

export const LENGTH = { torso: 50, neck: 8, headRadius: 10, upperArm: 27, forearm: 25, thigh: 36, shin: 35, foot: 9 }

/** Far limbs in side view sit a little back and up, which reads as depth. */
const FAR_OFFSET: Vec = [-3, -2]
const SHOULDER_HALF_WIDTH = 16
const HIP_HALF_WIDTH = 8
const END_SHOULDER: Vec = [24, -2]

export const dir = (degrees: number, length = 1): Vec => {
  const radians = (degrees * Math.PI) / 180
  return [Math.sin(radians) * length, Math.cos(radians) * length]
}
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]
const scale = (a: Vec, factor: number): Vec => [a[0] * factor, a[1] * factor]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpPair = <T extends readonly [number, number]>(a: T, b: T, t: number) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] as const

/** Rotates the short way round (from -170° to 100° goes via 180°, not through 0°). */
const lerpAngle = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t
const lerpLimb = (a: Limb, b: Limb, t: number): Limb => [lerpAngle(a[0], b[0], t), lerpAngle(a[1], b[1], t)]

export function interpolatePose(from: Pose, to: Pose, t: number): Pose {
  return {
    root: lerpPair(from.root, to.root, t),
    torso: lerpAngle(from.torso, to.torso, t),
    head: lerpAngle(from.head, to.head, t),
    arms: [lerpLimb(from.arms[0], to.arms[0], t), lerpLimb(from.arms[1], to.arms[1], t)],
    legs: [lerpLimb(from.legs[0], to.legs[0], t), lerpLimb(from.legs[1], to.legs[1], t)],
    armScale: lerpPair(from.armScale ?? [1, 1], to.armScale ?? [1, 1], t),
    legScale: lerpPair(from.legScale ?? [1, 1], to.legScale ?? [1, 1], t),
    feet: lerpPair(from.feet ?? [90, 90], to.feet ?? [90, 90], t),
  }
}

/** Mirrors a limb to the other side in front view (angles flip around the vertical). */
export const mirror = (limb: Limb): Limb => [-limb[0], -limb[1]]

const angleOf = (vector: Vec) => (Math.atan2(vector[0], vector[1]) * 180) / Math.PI

/**
 * Two-bone inverse kinematics: the limb angles that put the end of a chain starting at `start`
 * onto `target`. `bend` picks the side the middle joint (elbow/knee) points to.
 */
export function reach(start: Vec, target: Vec, upperLength: number, lowerLength: number, bend: 1 | -1): Limb {
  const delta = sub(target, start)
  const distance = Math.min(Math.max(Math.hypot(delta[0], delta[1]), Math.abs(upperLength - lowerLength) + 0.01), upperLength + lowerLength - 0.01)
  const inner = (Math.acos((upperLength ** 2 + distance ** 2 - lowerLength ** 2) / (2 * upperLength * distance)) * 180) / Math.PI
  const upper = angleOf(delta) + bend * inner
  const middle = add(start, dir(upper, upperLength))
  return [upper, angleOf(sub(target, middle))]
}

/** Returns `pose` with both arms solved so the hands land on `targets` (near/right first). */
export function withHands(setup: RigSetup, pose: Pose, targets: readonly [Vec, Vec], bends: readonly [1 | -1, 1 | -1]): Pose {
  const { shoulders } = solvePose(setup, pose)
  const [upperScale, foreScale] = pose.armScale ?? [1, 1]
  const arm = (index: 0 | 1) =>
    reach(shoulders[index], targets[index], LENGTH.upperArm * upperScale, LENGTH.forearm * foreScale, bends[index])
  return { ...pose, arms: [arm(0), arm(1)] }
}

function limbChain(start: Vec, limb: Limb, upperLength: number, lowerLength: number): [Vec, Vec] {
  const middle = add(start, dir(limb[0], upperLength))
  return [middle, add(middle, dir(limb[1], lowerLength))]
}

/** Forward kinematics: joint positions for a pose. */
export function solvePose(setup: RigSetup, pose: Pose): Skeleton {
  const [upperScale, foreScale] = pose.armScale ?? [1, 1]
  const [thighScale, shinScale] = pose.legScale ?? [1, 1]
  const thigh = LENGTH.thigh * thighScale
  const shin = LENGTH.shin * shinScale
  const { view } = setup

  if (view === 'end') {
    const chest = pose.root
    const shoulders: [Vec, Vec] = [add(chest, END_SHOULDER), add(chest, [-END_SHOULDER[0], END_SHOULDER[1]])]
    const [elbowR, handR] = limbChain(shoulders[0], pose.arms[0], LENGTH.upperArm * upperScale, LENGTH.forearm * foreScale)
    const [elbowL, handL] = limbChain(shoulders[1], pose.arms[1], LENGTH.upperArm * upperScale, LENGTH.forearm * foreScale)
    const none: [Vec, Vec] = [chest, chest]
    return {
      view,
      head: add(chest, [0, -17]),
      neck: chest,
      shoulderCenter: chest,
      midTorso: chest,
      pelvis: chest,
      torsoAngle: 180,
      shoulders,
      elbows: [elbowR, elbowL],
      hands: [handR, handL],
      hips: none,
      knees: none,
      ankles: none,
      toes: none,
    }
  }

  // Side: the far side sits slightly behind. Front: left/right are offset sideways from the spine.
  const sideways = dir(pose.torso - 90)
  const hipOffset = (index: 0 | 1): Vec =>
    view === 'side' ? (index === 0 ? [0, 0] : FAR_OFFSET) : scale(sideways, index === 0 ? HIP_HALF_WIDTH : -HIP_HALF_WIDTH)

  let pelvis: Vec
  if (setup.root === 'ankle') {
    // Walk up the near/right leg from the planted foot.
    const knee = sub(pose.root, dir(pose.legs[0][1], shin))
    const hip = sub(knee, dir(pose.legs[0][0], thigh))
    pelvis = sub(hip, hipOffset(0))
  } else {
    pelvis = pose.root
  }

  const hips: [Vec, Vec] = [add(pelvis, hipOffset(0)), add(pelvis, hipOffset(1))]
  const [kneeNear, ankleNear] = limbChain(hips[0], pose.legs[0], thigh, shin)
  const [kneeFar, ankleFar] = limbChain(hips[1], pose.legs[1], thigh, shin)
  const feet = pose.feet ?? [90, 90]
  const toes: [Vec, Vec] =
    view === 'side'
      ? [add(ankleNear, dir(feet[0], LENGTH.foot)), add(ankleFar, dir(feet[1], LENGTH.foot))]
      : [add(ankleNear, dir(90, 6)), add(ankleFar, dir(-90, 6))]

  const shoulderCenter = add(pelvis, dir(pose.torso, LENGTH.torso))
  const shoulders: [Vec, Vec] =
    view === 'side'
      ? [shoulderCenter, add(shoulderCenter, FAR_OFFSET)]
      : [add(shoulderCenter, scale(sideways, SHOULDER_HALF_WIDTH)), add(shoulderCenter, scale(sideways, -SHOULDER_HALF_WIDTH))]
  const [elbowNear, handNear] = limbChain(shoulders[0], pose.arms[0], LENGTH.upperArm * upperScale, LENGTH.forearm * foreScale)
  const [elbowFar, handFar] = limbChain(shoulders[1], pose.arms[1], LENGTH.upperArm * upperScale, LENGTH.forearm * foreScale)

  return {
    view,
    head: add(shoulderCenter, dir(pose.head, LENGTH.neck + LENGTH.headRadius)),
    neck: add(shoulderCenter, dir(pose.head, LENGTH.neck)),
    shoulderCenter,
    midTorso: add(pelvis, dir(pose.torso, LENGTH.torso / 2)),
    pelvis,
    torsoAngle: pose.torso,
    shoulders,
    elbows: [elbowNear, elbowFar],
    hands: [handNear, handFar],
    hips,
    knees: [kneeNear, kneeFar],
    ankles: [ankleNear, ankleFar],
    toes,
  }
}
