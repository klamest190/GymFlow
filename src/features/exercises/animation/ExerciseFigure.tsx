import type { BodyPart, ExerciseAnimationSpec } from './poses'
import { dir, type Skeleton, type Vec } from './rig'

const WIDTH = { torso: 17, neck: 7, upperArm: 9.5, forearm: 8, thigh: 12.5, shin: 10, foot: 6 }
const FLOOR_Y = 177

// Colors come from CSS tokens (index.css → --figure-*), so the figure follows light/dark mode.
const COLOR = {
  body: 'var(--figure-body)',
  far: 'var(--figure-far)',
  highlight: 'var(--figure-highlight)',
  soft: 'var(--figure-highlight-soft)',
  gear: 'var(--figure-gear)',
  ground: 'var(--figure-ground)',
}

type Side = 0 | 1

/** Tighter crop for small thumbnails: the figures never use the outer margin of the stage. */
const COMPACT_VIEWBOX = '14 12 172 172'

/** Static drawing of one frame; `ExerciseAnimation` re-renders it with a new skeleton per frame. */
export function ExerciseFigure({ spec, skeleton: s, compact }: { spec: ExerciseAnimationSpec; skeleton: Skeleton; compact?: boolean }) {
  const { primary, secondary = [] } = spec.highlight
  // Far limbs in side view are drawn fainter; a working muscle there uses the soft highlight.
  const color = (part: BodyPart, side: Side = 0) => {
    const far = s.view === 'side' && side === 1
    if (primary.includes(part)) return far ? COLOR.soft : COLOR.highlight
    if (secondary.includes(part)) return far ? COLOR.far : COLOR.soft
    return far ? COLOR.far : COLOR.body
  }
  const bodyColor = (side: Side) => (s.view === 'side' && side === 1 ? COLOR.far : COLOR.body)

  const leg = (side: Side) =>
    s.view !== 'end' && (
      <g key={`leg-${side}`}>
        <Bone a={s.hips[side]} b={s.knees[side]} width={WIDTH.thigh} color={color('thighs', side)} />
        <Bone a={s.knees[side]} b={s.ankles[side]} width={WIDTH.shin} color={bodyColor(side)} />
        <Bone a={s.ankles[side]} b={s.toes[side]} width={WIDTH.foot} color={bodyColor(side)} />
      </g>
    )
  const arm = (side: Side) => (
    <g key={`arm-${side}`}>
      <Bone a={s.shoulders[side]} b={s.elbows[side]} width={WIDTH.upperArm} color={color('upperArms', side)} />
      <Bone a={s.elbows[side]} b={s.hands[side]} width={WIDTH.forearm} color={color('forearms', side)} />
      {(primary.includes('shoulders') || secondary.includes('shoulders')) && (
        <circle cx={s.shoulders[side][0]} cy={s.shoulders[side][1]} r={6.5} fill={color('shoulders', side)} />
      )}
      {spec.equipment === 'dumbbells' && <Dumbbell at={s.hands[side]} faded={s.view === 'side' && side === 1} />}
    </g>
  )

  return (
    <svg viewBox={spec.viewBox ?? (compact ? COMPACT_VIEWBOX : '0 0 200 200')} className="size-full" aria-hidden>
      {spec.ground === 'bench' ? <Bench /> : <line x1={18} y1={FLOOR_Y} x2={182} y2={FLOOR_Y} stroke={COLOR.ground} strokeWidth={2.5} strokeLinecap="round" />}

      {s.view === 'side' && (
        <>
          {leg(1)}
          {arm(1)}
          <Torso s={s} color={color} />
          {spec.equipment === 'barbell' && <BarbellOnBack s={s} />}
          {leg(0)}
          {arm(0)}
        </>
      )}
      {s.view === 'front' && (
        <>
          {leg(0)}
          {leg(1)}
          <Torso s={s} color={color} />
          {arm(0)}
          {arm(1)}
          {spec.equipment === 'barbell' && <BarbellAcross s={s} />}
        </>
      )}
      {s.view === 'end' && (
        <>
          <circle cx={s.head[0]} cy={s.head[1]} r={9.5} fill={COLOR.body} />
          {arm(0)}
          {arm(1)}
          <Torso s={s} color={color} />
          {spec.equipment === 'barbell' && <BarbellAcross s={s} />}
        </>
      )}
    </svg>
  )
}

function Bone({ a, b, width, color }: { a: Vec; b: Vec; width: number; color: string }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={width} strokeLinecap="round" />
}

/** Chest and abs as separate regions, so either can light up; plus neck and head. */
function Torso({ s, color }: { s: Skeleton; color: (part: BodyPart) => string }) {
  if (s.view === 'end') {
    // Lying on the back, seen from the feet: the chest is a wide oval on the bench.
    const [x, y] = s.shoulderCenter
    return <ellipse cx={x} cy={y} rx={29} ry={12} fill={color('chest')} />
  }
  const head = (
    <>
      <Bone a={s.shoulderCenter} b={s.neck} width={WIDTH.neck} color={COLOR.body} />
      <circle cx={s.head[0]} cy={s.head[1]} r={10} fill={COLOR.body} />
    </>
  )
  if (s.view === 'side') {
    return (
      <>
        <Bone a={s.pelvis} b={s.midTorso} width={WIDTH.torso} color={color('abs')} />
        <Bone a={s.midTorso} b={s.shoulderCenter} width={WIDTH.torso} color={color('chest')} />
        {head}
      </>
    )
  }
  // Front view: two rounded trapezoids, wide at the shoulders and narrower at the waist.
  const sideways = dir(s.torsoAngle - 90)
  const at = (center: Vec, half: number): [Vec, Vec] => [
    [center[0] + sideways[0] * half, center[1] + sideways[1] * half],
    [center[0] - sideways[0] * half, center[1] - sideways[1] * half],
  ]
  const [shoulderR, shoulderL] = at(s.shoulderCenter, 14)
  const [midR, midL] = at(s.midTorso, 11)
  const [hipR, hipL] = at(s.pelvis, 10)
  const polygon = (points: Vec[], fill: string) => (
    <polygon points={points.map((p) => p.join(',')).join(' ')} fill={fill} stroke={fill} strokeWidth={8} strokeLinejoin="round" />
  )
  return (
    <>
      {head}
      {polygon([midR, hipR, hipL, midL], color('abs'))}
      {polygon([shoulderR, midR, midL, shoulderL], color('chest'))}
    </>
  )
}

function Dumbbell({ at, faded }: { at: Vec; faded: boolean }) {
  return (
    <g opacity={faded ? 0.5 : 1}>
      <circle cx={at[0]} cy={at[1]} r={6.5} fill={COLOR.gear} />
      <circle cx={at[0]} cy={at[1]} r={2} fill={COLOR.ground} />
    </g>
  )
}

/** Bar seen from the front, held in both hands, with plates on the ends. */
function BarbellAcross({ s }: { s: Skeleton }) {
  const y = (s.hands[0][1] + s.hands[1][1]) / 2
  const left = Math.min(s.hands[0][0], s.hands[1][0]) - 30
  const right = Math.max(s.hands[0][0], s.hands[1][0]) + 30
  return (
    <g>
      <line x1={left} y1={y} x2={right} y2={y} stroke={COLOR.gear} strokeWidth={3.5} strokeLinecap="round" />
      {[left + 2, right - 9].map((x) => (
        <rect key={x} x={x} y={y - 13} width={7} height={26} rx={2.5} fill={COLOR.gear} />
      ))}
    </g>
  )
}

/** Squat bar seen from the side: a plate resting on the upper back. */
function BarbellOnBack({ s }: { s: Skeleton }) {
  // On the upper back, just below the neck: a little behind and down from the shoulder line.
  const [x, y] = s.shoulderCenter
  const back = dir(s.torsoAngle + 90, 11)
  const down = dir(s.torsoAngle, -5)
  const cx = x + back[0] + down[0]
  const cy = y + back[1] + down[1]
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={COLOR.gear} />
      <circle cx={cx} cy={cy} r={3} fill={COLOR.ground} />
    </g>
  )
}

function Bench() {
  return (
    <g fill={COLOR.ground} stroke={COLOR.ground} strokeLinecap="round">
      <rect x={66} y={131} width={68} height={9} rx={4} stroke="none" />
      <line x1={78} y1={140} x2={78} y2={FLOOR_Y} strokeWidth={5} />
      <line x1={122} y1={140} x2={122} y2={FLOOR_Y} strokeWidth={5} />
      <line x1={18} y1={FLOOR_Y} x2={182} y2={FLOOR_Y} strokeWidth={2.5} />
    </g>
  )
}
