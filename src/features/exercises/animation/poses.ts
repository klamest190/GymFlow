import type { Camera } from './camera'
import {
  LENGTH,
  add,
  distance,
  interpolatePose,
  lerp3,
  limb,
  normalize,
  scale,
  seg,
  solvePose,
  sub,
  withHands,
  type PartProgress,
  type Pose,
  type PosePart,
  type RigSetup,
  type Skeleton,
  type Vec3,
} from './rig'

/**
 * Body regions that can light up as working muscles. `back` is the upper back, `lowerBack` the
 * lower back with the glutes, `calves` the lower legs.
 */
export type BodyPart = 'chest' | 'abs' | 'back' | 'lowerBack' | 'shoulders' | 'upperArms' | 'forearms' | 'thighs' | 'calves'

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
  /**
   * The share of the repetition (start, end of the progress 0–1) in which a body part moves;
   * default all of it. Real joints don't move in lockstep: the head tucks before the back rolls
   * up, the wrist turns while the dumbbell leaves the thigh. On the way back the order reverses.
   */
  phases?: Partial<Record<PosePart, readonly [start: number, end: number]>>
  /** Seconds for from → to and back; slow on the lowering (eccentric) part. */
  tempo: readonly [number, number]
  highlight: { primary: BodyPart[]; secondary?: BodyPart[] }
  /** Every catalog exercise is done with two light dumbbells, one per hand. */
  equipment: 'none' | 'dumbbells'
  /**
   * Dumbbell handle direction in the torso frame [outward, up the spine, out of the chest]; default
   * sideways. Ignored when the poses set `forearmRoll`: then the handle turns with the forearm.
   */
  handle?: Vec3
  ground: 'floor' | 'bench'
  /** Progress (0 = from, 1 = to) for the still image in lists. */
  still: number
  /** The angle that shows the movement best (thumbnails, and the default in the detail view). */
  camera: Camera
}

const POSE_PARTS: readonly PosePart[] = ['torso', 'head', 'arms', 'legs', 'forearms']
/** Eases in and out of a phase, so a part that starts late doesn't jerk into motion. */
const smoothstep = (x: number) => x * x * (3 - 2 * x)

/** Each body part's own progress at overall progress `t`. */
export function partProgress(spec: ExerciseAnimationSpec, t: number): PartProgress {
  const entries = POSE_PARTS.map((part) => {
    const phase = spec.phases?.[part]
    if (!phase) return [part, t] as const
    const [start, end] = phase
    return [part, smoothstep(Math.min(1, Math.max(0, (t - start) / (end - start))))] as const
  })
  return Object.fromEntries(entries) as Record<PosePart, number>
}

/** The figure at progress `t` of the repetition. */
export function skeletonAt(spec: ExerciseAnimationSpec, t: number): Skeleton {
  const pose = interpolatePose(spec.from, spec.to, partProgress(spec, t))
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
/** Handle directions (torso frame): across the body, along the spine, away from the chest. */
const SIDEWAYS: Vec3 = [1, 0, 0]
const ALONG_SPINE: Vec3 = [0, 1, 0]
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

/** Dumbbells on the bench press: straight up and down over the lower chest, `halfGrip` from the middle. */
const benchGrip = (halfGrip: number) => (s: Skeleton, t: number) =>
  inTorso(s, s.shoulderCenter, lerp3([halfGrip, -3, 48], [halfGrip, -13, 12.5], t))

/**
 * Hip hinge: the hips pushed back over soft knees, the torso leaning forward (`torso` = its angle,
 * 90 is level with the floor), the neck in line with the spine.
 */
const hinged = (torso: number, thigh: number, shin: number): Pose => ({
  ...standing,
  torso: seg(torso),
  head: seg(torso + 4),
  legs: both(limb([thigh, LEG_SPREAD], [shin, LEG_SPREAD])),
})

/**
 * Rowing hand path (+x side first): from hanging straight below the shoulder to beside the hip,
 * where the forearm hangs vertically under the raised elbow.
 */
const rowHands = (s: Skeleton, t: number): [Vec3, Vec3] => {
  const pulled = inTorso(s, s.shoulderCenter, [17, -35, 0])
  return [lerp3(add(s.shoulders[0], [-1, -50, 2]), pulled[0], t), lerp3(add(s.shoulders[1], [1, -50, 2]), pulled[1], t)]
}

/** Elbow pole for rows: out of the back of a torso leaning at `torso` (`seg` angle), a little outward. */
const behindTorso = (torso: number): Vec3 => {
  const radians = (torso * Math.PI) / 180
  return [0.15, Math.sin(radians), Math.cos(radians)]
}

/** An arm that is straight but not locked. */
const HANGING_ARM = LENGTH.upperArm + LENGTH.forearm - 1

/**
 * Hands resting on the front of the thighs (+x side first): the dumbbells hang from almost straight
 * arms and lie against the legs, as low as the arms reach (at most down to the knee). As the hips
 * hinge back, they slide down the thighs by themselves.
 */
const onThighs = (s: Skeleton): [Vec3, Vec3] => {
  const hand = (side: 0 | 1) => {
    const along = normalize(sub(s.knees[side], s.hips[side]))
    const front = normalize(sub([0, 0, 1], scale(along, along[2])))
    const at = (k: number) => add(add(lerp3(s.hips[side], s.knees[side], k), scale(front, 10.5)), [side === 0 ? 2 : -2, 0, 0])
    const reaches = (k: number) => distance(s.shoulders[side], at(k)) <= HANGING_ARM
    if (reaches(1)) return at(1)
    if (!reaches(0)) return at(0)
    // Lower down the thigh is farther from the shoulder: bisect for the lowest point in reach.
    let [low, high] = [0, 1]
    for (let step = 0; step < 24; step++) {
      const middle = (low + high) / 2
      if (reaches(middle)) low = middle
      else high = middle
    }
    return at(low)
  }
  return [hand(0), hand(1)]
}

/** Whether the exercise also lights up supporting muscles (for the legend). */
export const hasSecondaryHighlight = (exerciseId: string) => Boolean(EXERCISE_ANIMATIONS[exerciseId]?.highlight.secondary?.length)

/** Keyed by exercise ID (`data/exercises.ts`); a new catalog exercise without entry shows no animation. */
export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimationSpec> = {
  'wide-grip-bench-press': {
    setup: GROUNDED,
    from: lying,
    to: lying,
    grip: { at: benchGrip(31), elbows: both([0.8, -1, 0.35]) },
    tempo: [1.6, 1],
    highlight: { primary: ['chest'], secondary: ['shoulders', 'upperArms'] },
    equipment: 'dumbbells',
    ground: 'bench',
    still: 0,
    camera: BENCH_VIEW,
  },
  'close-grip-bench-press': {
    setup: GROUNDED,
    from: lying,
    to: lying,
    // Neutral grip, dumbbells close together; the elbows travel toward the feet instead of out to the sides.
    grip: { at: benchGrip(11), elbows: both([0.25, -1, 1]) },
    tempo: [1.6, 1],
    highlight: { primary: ['upperArms'], secondary: ['chest', 'shoulders'] },
    equipment: 'dumbbells',
    handle: ALONG_SPINE,
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
    handle: ALONG_SPINE,
    ground: 'bench',
    still: 0.35,
    camera: BENCH_VIEW,
  },
  'bicep-curls': {
    setup: STANDING,
    // Starts in the neutral grip (palms toward the thighs) and supinates on the way up, so the palms
    // face the shoulders at the top. The wrist turns mostly while the dumbbell leaves the thigh; the
    // elbows only drift forward a little near the top.
    from: { ...standing, arms: both(limb([0, 6], [4, 6])), forearmRoll: 0 },
    to: { ...standing, arms: both(limb([9, 6], [152, 4])), forearmRoll: 90 },
    phases: { forearms: [0, 0.6] },
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
    // Dumbbells racked in front of the shoulders, elbows pointing down and forward.
    grip: { at: (s) => inTorso(s, s.shoulderCenter, [16, 6, 13]), elbows: both([0.3, -1, 0.6]) },
    // The descent starts at the hips (the torso leans) a moment before the knees bend; on the way up
    // the legs drive first and the chest straightens last.
    phases: { torso: [0, 0.9], legs: [0.1, 1] },
    tempo: [1.6, 1],
    highlight: { primary: ['thighs'], secondary: ['abs'] },
    equipment: 'dumbbells',
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
    // Dumbbells hang beside the body, palms facing in.
    grip: { at: (s) => [add(s.shoulders[0], [9, -49, 0]), add(s.shoulders[1], [-9, -49, 0])], elbows: both([0.3, 0, -1]) },
    tempo: [1.4, 1],
    highlight: { primary: ['thighs'] },
    equipment: 'dumbbells',
    handle: FORWARD,
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
    // Dumbbells held upright on the chest, elbows out to the sides.
    grip: { at: (s) => inTorso(s, s.shoulderCenter, [9, -8, 16]), elbows: both([1, -0.3, 0.4]) },
    // The chin tucks first, then the upper back rolls up vertebra by vertebra (and down in reverse).
    phases: { head: [0, 0.55], torso: [0.15, 1] },
    tempo: [1, 1.4],
    highlight: { primary: ['abs'] },
    equipment: 'dumbbells',
    handle: ALONG_SPINE,
    ground: 'floor',
    still: 1,
    camera: { yaw: -62, pitch: 18 },
  },
  'russian-twists': {
    setup: GROUNDED,
    from: { ...seated, twist: 45 },
    to: { ...seated, twist: -45 },
    // Both dumbbells close together in front of the belly; they swing with the shoulders.
    grip: { at: (s) => inTorso(s, s.shoulderCenter, [8, -22, 27]), elbows: both([1, -0.6, 0]) },
    tempo: [0.9, 0.9],
    highlight: { primary: ['abs'] },
    equipment: 'dumbbells',
    handle: ALONG_SPINE,
    ground: 'floor',
    still: 0,
    camera: { yaw: -22, pitch: 24 },
  },
  'military-press': {
    setup: STANDING,
    from: standing,
    to: standing,
    // From shoulder height straight overhead, the dumbbells moving slightly together at the top.
    grip: { at: (s, t) => inTorso(s, s.shoulderCenter, lerp3([26, 4, 6], [20, 50, 2], t)), elbows: both([0.8, -1, 0.3]) },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'], secondary: ['upperArms'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: { yaw: -35, pitch: 10 },
  },
  'bent-over-row': {
    setup: STANDING,
    // Torso about 40° above level, neutral grip; both dumbbells travel up to the hips.
    from: { ...hinged(130, 30, -10), forearmRoll: 0 },
    to: { ...hinged(130, 30, -10), forearmRoll: 0 },
    grip: { at: rowHands, elbows: both(behindTorso(130)) },
    tempo: [1, 1.6],
    highlight: { primary: ['back'], secondary: ['upperArms', 'shoulders'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: { yaw: -118, pitch: 24 },
  },
  'one-arm-dumbbell-row': {
    // Staggered stance, the +x leg in front (root) with the +x hand propped on its thigh; the -x
    // arm rows. The rowing shoulder turns up a little at the top, the hips stay square.
    setup: STANDING,
    from: {
      ...standing,
      root: [10, 4, 25],
      torso: seg(120),
      head: seg(124),
      legs: [limb([35, 3], [-8, 2]), limb([-22, 3], [-28, 3])],
      forearmRoll: 0,
    },
    to: {
      ...standing,
      root: [10, 4, 25],
      torso: seg(120),
      twist: 6,
      head: seg(124),
      legs: [limb([35, 3], [-8, 2]), limb([-22, 3], [-28, 3])],
      forearmRoll: 0,
    },
    grip: {
      at: (s, t) => {
        const propped = add(lerp3(s.knees[0], s.hips[0], 0.25), [0, 9.5, 1])
        return [propped, rowHands(s, t)[1]]
      },
      elbows: [[1, 0, -0.6], behindTorso(120)],
    },
    tempo: [1, 1.6],
    highlight: { primary: ['back'], secondary: ['upperArms', 'shoulders'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: { yaw: -112, pitch: 20 },
  },
  'reverse-flys': {
    setup: STANDING,
    // Torso almost level; the slightly bent arms open out to the sides in a wide arc up to
    // shoulder height, palms facing down at the top.
    from: { ...hinged(110, 32, -8), arms: both(limb([0, 16], [6, 4])) },
    to: { ...hinged(110, 32, -8), arms: both(limb([0, 84], [28, 74])) },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'], secondary: ['back'] },
    equipment: 'dumbbells',
    handle: ALONG_SPINE,
    ground: 'floor',
    still: 1,
    camera: { yaw: -148, pitch: 30 },
  },
  'romanian-deadlift': {
    setup: STANDING,
    // The hips travel back while the knees stay softly bent; the dumbbells slide down the front of
    // the thighs to the knees. The knees unlock early, then the hinge carries the movement.
    from: standing,
    to: hinged(118, 32, -4),
    grip: { at: onThighs, elbows: both([0.2, 0, -1]) },
    phases: { legs: [0, 0.6] },
    tempo: [1.6, 1],
    highlight: { primary: ['thighs'], secondary: ['lowerBack'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: { yaw: -78, pitch: 12 },
  },
  'overhead-triceps-extension': {
    setup: STANDING,
    // Upper arms stay upright beside the head, elbows pointing forward; only the forearms move,
    // from straight overhead down behind the head, in the neutral grip.
    from: { ...standing, arms: both(limb([165, -3], [178, -4])), forearmRoll: 0 },
    to: { ...standing, arms: both(limb([162, -3], [-50, -2])), forearmRoll: 0 },
    tempo: [1.6, 1],
    highlight: { primary: ['upperArms'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: { yaw: -72, pitch: 8 },
  },
  'hammer-curls': {
    setup: STANDING,
    // Like the bicep curl, but the neutral grip (thumbs up) stays the whole way.
    from: { ...standing, arms: both(limb([0, 6], [4, 6])), forearmRoll: 0 },
    to: { ...standing, arms: both(limb([9, 6], [152, 4])), forearmRoll: 0 },
    tempo: [1, 1.6],
    highlight: { primary: ['upperArms', 'forearms'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
    camera: THREE_QUARTER,
  },
  'calf-raises': {
    setup: STANDING,
    // The heels rise while the balls of the feet stay put: the ankle (root) moves up and a little
    // forward exactly as much as the foot tilts. Dumbbells hang at the sides.
    from: { ...standing, arms: both(limb([0, 8], [2, 7])), feet: both(seg(90, 10)) },
    to: {
      ...standing,
      root: add(standing.root, scale(sub(seg(90, 10), seg(40, 10)), LENGTH.foot)),
      arms: both(limb([0, 8], [2, 7])),
      feet: both(seg(40, 10)),
    },
    tempo: [0.8, 1.4],
    highlight: { primary: ['calves'] },
    equipment: 'dumbbells',
    handle: FORWARD,
    ground: 'floor',
    still: 1,
    camera: { yaw: -80, pitch: 6 },
  },
}
