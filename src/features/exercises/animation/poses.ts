import type { Camera } from './camera'
import { add, interpolatePose, lerp3, limb, scale, seg, solvePose, withHands, type Pose, type RigSetup, type Skeleton, type Vec3 } from './rig'

/** Body regions that can light up as working muscles. */
export type BodyPart = 'chest' | 'abs' | 'shoulders' | 'upperArms' | 'forearms' | 'thighs'

export interface ExerciseAnimationSpec {
  setup: RigSetup
  /** Starting position. */
  from: Pose
  /** Turning point of the repetition. */
  to: Pose
  /**
   * Hands placed by inverse kinematics on every frame (overrides the poses' arms): where they
   * are at progress `t` (+x side first) and which way the elbows point (side-relative).
   * Keeps a bar on a straight path or the hands on the head while the body moves.
   */
  grip?: { at: (skeleton: Skeleton, t: number) => readonly [Vec3, Vec3]; elbows: readonly [Vec3, Vec3] }
  /** Seconds for from → to and back; slow on the lowering (eccentric) part. */
  tempo: readonly [number, number]
  highlight: { primary: BodyPart[]; secondary?: BodyPart[] }
  equipment: 'none' | 'dumbbells' | 'barbell'
  /** Dumbbell handle direction (world); default sideways. */
  handle?: Vec3
  ground: 'floor' | 'bench'
  /** Progress (0 = from, 1 = to) for the still image in lists. */
  still: number
  /** The angle that shows the movement best (thumbnails, and the default in the detail view). */
  camera: Camera
}

/** The figure at progress `t` of the repetition. */
export function skeletonAt(spec: ExerciseAnimationSpec, t: number): Skeleton {
  const pose = interpolatePose(spec.from, spec.to, t)
  if (!spec.grip) return solvePose(spec.setup, pose)
  const targets = spec.grip.at(solvePose(spec.setup, pose), t)
  return solvePose(spec.setup, withHands(spec.setup, pose, targets, spec.grip.elbows))
}

/** A point in the torso frame of `s` (sideways, up the spine, out of the chest), on both sides. */
const inTorso = (s: Skeleton, origin: Vec3, [side, up, out]: Vec3): [Vec3, Vec3] => {
  const rest = add(add(origin, scale(s.spine, up)), scale(s.forward, out))
  return [add(rest, scale(s.lateral, side)), add(rest, scale(s.lateral, -side))]
}
const both = <T>(value: T) => [value, value] as const

const STANDING: RigSetup = { root: 'ankle' }
const GROUNDED: RigSetup = { root: 'pelvis' }
const UP = seg(180)
const SIDEWAYS: Vec3 = [1, 0, 0]
const FORWARD: Vec3 = [0, 0, 1]
/** 3/4 view from the front-left: the figure faces right on screen and shows its depth. */
const THREE_QUARTER: Camera = { yaw: -58, pitch: 14 }
/** On the bench from the head end: chest, arms and bar in front, the legs further back. */
const BENCH_VIEW: Camera = { yaw: -152, pitch: 34 }

/** Upright, arms hanging; the +x ankle (root) stands on the floor, the pelvis centered on x = 0. */
const LEG_SPREAD = 3
const standing: Pose = {
  root: [8 + Math.sin((LEG_SPREAD * Math.PI) / 180) * 71, 4, 0],
  torso: UP,
  head: UP,
  arms: both(limb([0, 8], [4, 7])),
  legs: both(limb([0, LEG_SPREAD], [0, LEG_SPREAD])),
}

/** On the back on a flat bench (head toward -z), feet on the floor. */
const lying: Pose = {
  root: [0, 49, 18],
  torso: seg(-90),
  head: seg(-90),
  arms: both(limb(180, 180)),
  legs: both(limb([75, 15], [6, 8])),
}

/** Seated on the floor leaning back, knees up. */
const seated: Pose = {
  root: [0, 9, 0],
  torso: seg(-140),
  head: seg(-158),
  arms: both(limb(90, 90)),
  legs: both(limb([128, 12], [42, 6])),
}

/** Bar on the bench press: straight up and down over the lower chest, `halfGrip` from the middle. */
const benchGrip = (halfGrip: number) => (s: Skeleton, t: number) =>
  inTorso(s, s.shoulderCenter, lerp3([halfGrip, -3, 48], [halfGrip, -13, 12.5], t))

/** Whether the exercise also lights up supporting muscles (for the legend). */
export const hasSecondaryHighlight = (exerciseId: string) => Boolean(EXERCISE_ANIMATIONS[exerciseId]?.highlight.secondary?.length)

/** Keyed by exercise ID (`data/exercises.ts`); a new catalog exercise without entry shows no animation. */
export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimationSpec> = {
  'wide-grip-bench-press': {
    setup: GROUNDED,
    from: lying,
    to: lying,
    grip: { at: benchGrip(33), elbows: both([0.8, -1, 0.35]) },
    tempo: [1.6, 1],
    highlight: { primary: ['chest'], secondary: ['shoulders', 'upperArms'] },
    equipment: 'barbell',
    ground: 'bench',
    still: 0,
    camera: BENCH_VIEW,
  },
  'close-grip-bench-press': {
    setup: GROUNDED,
    from: lying,
    to: lying,
    // Elbows tucked: they travel toward the feet instead of out to the sides.
    grip: { at: benchGrip(12), elbows: both([0.25, -1, 1]) },
    tempo: [1.6, 1],
    highlight: { primary: ['upperArms'], secondary: ['chest', 'shoulders'] },
    equipment: 'barbell',
    ground: 'bench',
    still: 0,
    camera: BENCH_VIEW,
  },
  butterflies: {
    setup: GROUNDED,
    from: lying,
    to: lying,
    // The hands move on an arc at a constant distance from the shoulder: the elbow angle stays fixed.
    grip: {
      at: (s, t) => {
        const angle = ((-12 + 92 * t) * Math.PI) / 180
        const [near] = inTorso(s, s.shoulders[0], [Math.sin(angle) * 45, 3, Math.cos(angle) * 45])
        const [, far] = inTorso(s, s.shoulders[1], [Math.sin(angle) * 45, 3, Math.cos(angle) * 45])
        return [near, far]
      },
      elbows: both([1, -0.7, 0.2]),
    },
    tempo: [1.6, 1.2],
    highlight: { primary: ['chest'], secondary: ['shoulders'] },
    equipment: 'dumbbells',
    handle: FORWARD,
    ground: 'bench',
    still: 0.35,
    camera: BENCH_VIEW,
  },
  'bicep-curls': {
    setup: STANDING,
    from: { ...standing, arms: both(limb([0, 6], [4, 6])) },
    to: { ...standing, arms: both(limb([9, 6], [152, 4])) },
    tempo: [1, 1.6],
    highlight: { primary: ['upperArms'], secondary: ['forearms'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: THREE_QUARTER,
  },
  'lateral-raises': {
    setup: STANDING,
    from: { ...standing, arms: both(limb([10, 12], [20, 10])) },
    // Slightly in front of the body (scapular plane), elbows a little bent, up to shoulder height.
    to: { ...standing, arms: both(limb([78, 70], [88, 60])) },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'] },
    equipment: 'dumbbells',
    handle: FORWARD,
    ground: 'floor',
    still: 1,
    camera: { yaw: -28, pitch: 12 },
  },
  'front-raises': {
    setup: STANDING,
    from: { ...standing, arms: both(limb([8, 6], [10, 4])) },
    to: { ...standing, arms: both(limb([88, 8], [92, 6])) },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'], secondary: ['chest'] },
    equipment: 'dumbbells',
    handle: SIDEWAYS,
    ground: 'floor',
    still: 1,
    camera: THREE_QUARTER,
  },
  squats: {
    setup: STANDING,
    from: { ...standing, legs: both(limb([0, 10], [0, 6])), feet: both(seg(90, 18)) },
    to: {
      ...standing,
      torso: seg(145),
      head: seg(165),
      legs: both(limb([80, 18], [-25, 8])),
      feet: both(seg(90, 18)),
    },
    // Bar on the upper back, hands just outside the shoulders.
    grip: { at: (s) => inTorso(s, s.shoulderCenter, [27, -3, -9]), elbows: both([0.3, -1, -0.6]) },
    tempo: [1.6, 1],
    highlight: { primary: ['thighs'], secondary: ['abs'] },
    equipment: 'barbell',
    ground: 'floor',
    still: 1,
    camera: { yaw: -38, pitch: 14 },
  },
  lunges: {
    // The +x leg steps forward and stays planted (root); the -x knee sinks toward the floor.
    setup: STANDING,
    from: {
      ...standing,
      root: [10, 4, 28],
      legs: [limb([40, 3], [0, 2]), limb([-25, 3], [-50, 2])],
      feet: [seg(90, 8), seg(40)],
    },
    to: {
      ...standing,
      root: [10, 4, 28],
      torso: seg(178),
      legs: [limb([80, 3], [-10, 2]), limb([-5, 3], [-85, 2])],
      feet: [seg(90, 8), seg(60)],
    },
    grip: { at: (s) => inTorso(s, s.pelvis, [15, 8, 1]), elbows: both([1, 0, -0.7]) },
    tempo: [1.4, 1],
    highlight: { primary: ['thighs'] },
    equipment: 'none',
    ground: 'floor',
    still: 1,
    camera: THREE_QUARTER,
  },
  crunches: {
    setup: GROUNDED,
    from: {
      root: [0, 8, 10],
      torso: seg(-92),
      head: seg(-96),
      arms: both(limb(180, 180)),
      legs: both(limb([145, 10], [30, 8])),
    },
    to: {
      root: [0, 8, 10],
      torso: seg(-125),
      head: seg(-142),
      arms: both(limb(180, 180)),
      legs: both(limb([145, 10], [30, 8])),
    },
    // Fingertips behind the head, elbows wide.
    grip: { at: (s) => inTorso(s, s.head, [6, 2, -6]), elbows: both([1, 0, 0.4]) },
    tempo: [1, 1.4],
    highlight: { primary: ['abs'] },
    equipment: 'none',
    ground: 'floor',
    still: 1,
    camera: { yaw: -62, pitch: 18 },
  },
  'russian-twists': {
    setup: GROUNDED,
    from: { ...seated, twist: 45 },
    to: { ...seated, twist: -45 },
    // Hands together in front of the belly; they swing with the shoulders.
    grip: { at: (s) => inTorso(s, s.shoulderCenter, [3, -24, 27]), elbows: both([1, -0.6, 0]) },
    tempo: [0.9, 0.9],
    highlight: { primary: ['abs'] },
    equipment: 'none',
    ground: 'floor',
    still: 0,
    camera: { yaw: -22, pitch: 24 },
  },
  'military-press': {
    setup: STANDING,
    from: standing,
    to: standing,
    // From the collarbone straight overhead; elbows slightly in front of the bar at the bottom.
    grip: { at: (s, t) => inTorso(s, s.shoulderCenter, lerp3([25, 3, 11], [23, 50, 2], t)), elbows: both([0.6, -1, 0.5]) },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'], secondary: ['upperArms'] },
    equipment: 'barbell',
    ground: 'floor',
    still: 1,
    camera: { yaw: -35, pitch: 10 },
  },
}
