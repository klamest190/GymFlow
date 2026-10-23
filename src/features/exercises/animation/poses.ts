import { mirror, withHands, type Pose, type RigSetup, type Vec } from './rig'

/** Body regions that can light up as working muscles. */
export type BodyPart = 'chest' | 'abs' | 'shoulders' | 'upperArms' | 'forearms' | 'thighs'

export interface ExerciseAnimationSpec {
  setup: RigSetup
  /** Starting position. */
  from: Pose
  /** Turning point of the repetition. */
  to: Pose
  /** Seconds for from → to and back; slow on the lowering (eccentric) part. */
  tempo: readonly [number, number]
  highlight: { primary: BodyPart[]; secondary?: BodyPart[] }
  equipment: 'none' | 'dumbbells' | 'barbell'
  ground: 'floor' | 'bench'
  /** Progress (0 = from, 1 = to) for the still image in lists. */
  still: number
  /** SVG viewBox when the movement needs more room than 0 0 200 200 (e.g. overhead presses). */
  viewBox?: string
}

const SIDE_STANDING: RigSetup = { view: 'side', root: 'ankle' }
const FRONT_STANDING: RigSetup = { view: 'front', root: 'ankle' }
const BENCH: RigSetup = { view: 'end', root: 'chest' }

/** Upright, arms hanging; the ankle (root) stands on the floor line. */
const standingSide: Pose = {
  root: [96, 172],
  torso: 180,
  head: 180,
  arms: [
    [3, 2],
    [3, 2],
  ],
  legs: [
    [0, 0],
    [0, 0],
  ],
}

const standingFront: Pose = {
  root: [108, 172],
  torso: 180,
  head: 180,
  arms: [[8, 4], mirror([8, 4])],
  legs: [[4, 2], mirror([4, 2])],
}

/** Sitting on the floor facing the viewer, knees raised toward the viewer (foreshortened). */
const SEATED_FRONT: RigSetup = { view: 'front', root: 'pelvis' }
const seatedFront: Pose = {
  root: [100, 168],
  torso: 180,
  head: 180,
  arms: [[0, 0], [0, 0]],
  legs: [[140, 25], mirror([140, 25])],
  legScale: [0.75, 0.6],
}

const onBench: Pose = { ...standingFront, root: [100, 120], legs: [[0, 0], [0, 0]] }
const benchPose = (hands: readonly [Vec, Vec], bends: readonly [1 | -1, 1 | -1], armScale?: readonly [number, number]) =>
  withHands(BENCH, { ...onBench, armScale }, hands, bends)

/** Whether the exercise also lights up supporting muscles (for the legend). */
export const hasSecondaryHighlight = (exerciseId: string) => Boolean(EXERCISE_ANIMATIONS[exerciseId]?.highlight.secondary?.length)

/** Keyed by exercise ID (`data/exercises.ts`); a new catalog exercise without entry shows no animation. */
export const EXERCISE_ANIMATIONS: Record<string, ExerciseAnimationSpec> = {
  'wide-grip-bench-press': {
    setup: BENCH,
    from: benchPose([[140, 66], [60, 66]], [-1, 1]),
    to: benchPose([[140, 102], [60, 102]], [-1, 1], [0.8, 1]),
    tempo: [1.6, 1],
    highlight: { primary: ['chest'], secondary: ['shoulders', 'upperArms'] },
    equipment: 'barbell',
    ground: 'bench',
    still: 0,
  },
  'close-grip-bench-press': {
    setup: BENCH,
    from: benchPose([[114, 66], [86, 66]], [-1, 1]),
    // Elbows tucked: the upper arms point toward the feet, so they look very short from here.
    to: benchPose([[114, 102], [86, 102]], [-1, 1], [0.35, 1.05]),
    tempo: [1.6, 1],
    highlight: { primary: ['upperArms'], secondary: ['chest', 'shoulders'] },
    equipment: 'barbell',
    ground: 'bench',
    still: 0,
  },
  butterflies: {
    setup: BENCH,
    from: benchPose([[108, 62], [92, 62]], [-1, 1]),
    to: benchPose([[164, 112], [36, 112]], [-1, 1]),
    tempo: [1.6, 1.2],
    highlight: { primary: ['chest'], secondary: ['shoulders'] },
    equipment: 'dumbbells',
    ground: 'bench',
    still: 0.35,
  },
  'bicep-curls': {
    setup: SIDE_STANDING,
    from: standingSide,
    to: { ...standingSide, arms: [[10, 160], [10, 160]] },
    tempo: [1, 1.6],
    highlight: { primary: ['upperArms'], secondary: ['forearms'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
  },
  'lateral-raises': {
    setup: FRONT_STANDING,
    from: standingFront,
    to: { ...standingFront, arms: [[86, 80], mirror([86, 80])] },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
  },
  'front-raises': {
    setup: SIDE_STANDING,
    from: { ...standingSide, arms: [[5, 4], [5, 4]] },
    to: { ...standingSide, arms: [[90, 92], [90, 92]] },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'], secondary: ['chest'] },
    equipment: 'dumbbells',
    ground: 'floor',
    still: 1,
  },
  squats: {
    setup: SIDE_STANDING,
    from: { ...standingSide, root: [100, 172], arms: [[-15, 175], [-15, 175]] },
    to: {
      ...standingSide,
      root: [100, 172],
      torso: 145,
      head: 165,
      arms: [[-50, 140], [-50, 140]],
      legs: [[80, -25], [80, -25]],
    },
    tempo: [1.6, 1],
    highlight: { primary: ['thighs'], secondary: ['abs'] },
    equipment: 'barbell',
    ground: 'floor',
    still: 1,
  },
  lunges: {
    setup: SIDE_STANDING,
    from: { ...standingSide, root: [122, 172], legs: [[40, 0], [-25, -50]], feet: [90, 40] },
    to: { ...standingSide, root: [122, 172], torso: 178, legs: [[80, -10], [-5, -85]], feet: [90, 60] },
    tempo: [1.4, 1],
    highlight: { primary: ['thighs'] },
    equipment: 'none',
    ground: 'floor',
    still: 1,
  },
  crunches: {
    setup: { view: 'side', root: 'pelvis' },
    from: {
      root: [112, 163],
      torso: -92,
      head: -95,
      arms: [[-150, -12], [-150, -12]],
      legs: [[145, 30], [145, 30]],
    },
    to: {
      root: [112, 163],
      torso: -125,
      head: -140,
      arms: [[-183, -45], [-183, -45]],
      legs: [[145, 30], [145, 30]],
    },
    tempo: [1, 1.4],
    highlight: { primary: ['abs'] },
    equipment: 'none',
    ground: 'floor',
    still: 1,
  },
  'russian-twists': {
    setup: SEATED_FRONT,
    from: withHands(SEATED_FRONT, { ...seatedFront, torso: 192, head: 190 }, [[66, 150], [72, 154]], [1, 1]),
    to: withHands(SEATED_FRONT, { ...seatedFront, torso: 168, head: 170 }, [[128, 154], [134, 150]], [-1, -1]),
    tempo: [0.9, 0.9],
    highlight: { primary: ['abs'] },
    equipment: 'none',
    ground: 'floor',
    still: 0,
  },
  'military-press': {
    setup: FRONT_STANDING,
    from: { ...standingFront, arms: [[40, 178], mirror([40, 178])] },
    to: { ...standingFront, arms: [[165, 178], mirror([165, 178])] },
    tempo: [1, 1.6],
    highlight: { primary: ['shoulders'], secondary: ['upperArms'] },
    equipment: 'barbell',
    ground: 'floor',
    still: 1,
    viewBox: '-14 -28 228 228',
  },
}
