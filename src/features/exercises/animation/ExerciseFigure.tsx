import { useId, type ReactNode } from 'react'
import { STAGE, projector, type Camera, type Projected, type Projector } from './camera'
import type { ExerciseAnimationSpec } from './poses'
import { add, cross, dot, normalize, scale, sub, type Skeleton, type Vec3 } from './rig'
import { bodyRank, paintOrder, type Rank } from './paintOrder'
import { buildScene, scenePoints, type CapsuleEnd, type Paint, type Shape, type StageLayout } from './scene'

// Colors come from CSS tokens (index.css → --figure-*), so the figure follows light/dark mode.
const TOKEN: Record<Paint, string> = {
  body: '--figure-body',
  highlight: '--figure-highlight',
  soft: '--figure-highlight-soft',
  gear: '--figure-gear',
  ground: '--figure-ground',
}
const GAP = 'var(--figure-gap)'
const SHEEN = 'var(--figure-sheen)'
/** Thin background-colored outline: keeps overlapping limbs apart without drawing lines. */
const GAP_WIDTH = 1.6
/** Light from the upper left of the screen (unit vector, y down). */
const LIGHT = [-0.55, -0.835] as const

type Point2 = readonly [number, number]

/**
 * Parts farther from the camera fade toward the background (aerial perspective), which reads
 * as depth even on a still image. 0 = nearest, up to 46 % for the far side of the body.
 */
const fogFor = (depth: number) => Math.round(Math.min(1, Math.max(0, 0.5 - depth / 56)) * 46)
const tone = (paint: Paint, fog = 0) =>
  fog <= 0 ? `var(${TOKEN[paint]})` : `color-mix(in srgb, var(${TOKEN[paint]}) ${100 - fog}%, var(--figure-gap))`

const pointsAttr =(points: readonly Point2[]) => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
const flat = ({ x, y }: Projected): Point2 => [x, y]

/** Convex hull (monotone chain) of screen points. */
function hull(points: Point2[]): Point2[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (sorted.length < 3) return sorted
  const turn = (o: Point2, a: Point2, b: Point2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: Point2[]) => {
    const chain: Point2[] = []
    for (const point of list) {
      while (chain.length >= 2 && turn(chain[chain.length - 2], chain[chain.length - 1], point) <= 0) chain.pop()
      chain.push(point)
    }
    chain.pop()
    return chain
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

function circle(center: Vec3, axis: Vec3, radius: number, steps = 16): Vec3[] {
  // Two directions perpendicular to the axis span the circle.
  const helper: Vec3 = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = normalize(sub(helper, scale(axis, dot(helper, axis))))
  const v = cross(axis, u)
  return Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2
    return add(center, add(scale(u, Math.cos(angle) * radius), scale(v, Math.sin(angle) * radius)))
  })
}

/** The drawing of one shape; the fog follows the true distance to the camera. */
function renderShape(shape: Shape, project: Projector, key: string, fogged: boolean, rank: Rank): ReactNode {
  switch (shape.kind) {
    case 'group':
    case 'seam': {
      const parts =
        shape.kind === 'seam' || shape.sorted
          ? paintOrder(shape.shapes, rank, project.eye)
          : shape.shapes.map((part, index) => ({ shape: part, key: String(index) }))
      return <g key={key}>{parts.map((part) => renderShape(part.shape, project, part.key, fogged, rank))}</g>
    }
    case 'capsule': {
      const a = project(shape.a)
      const b = project(shape.b)
      const depth = (a.depth + b.depth) / 2
      const half = (shape.radius * (a.scale + b.scale)) / 2
      // A joint end needs the neighbor segment on screen: where it goes and how thick it is.
      const end = (at: Projected, from: Projected, spec?: CapsuleEnd): EndSpec => {
        if (!spec || spec === 'attached') return spec ?? 'round'
        const next = project(spec.joint)
        return { next: flat(next), nextHalf: (spec.radius * (at.scale + next.scale)) / 2, owner: Boolean(spec.owner), from: flat(from) }
      }
      return (
        <Capsule
          key={key}
          a={flat(a)}
          b={flat(b)}
          half={half}
          start={end(a, b, shape.start)}
          end={end(b, a, shape.end)}
          fill={tone(shape.paint, fogged ? fogFor(depth) : 0)}
        />
      )
    }
    case 'sphere': {
      const center = project(shape.center)
      const fill = tone(shape.paint, fogged ? fogFor(center.depth) : 0)
      return <Ball key={key} at={flat(center)} radius={shape.radius * center.scale} fill={fill} />
    }
    case 'hull': {
      const projected = shape.points.map(project)
      const depth = projected.reduce((sum, point) => sum + point.depth, 0) / projected.length
      const outline = hull(projected.map(flat))
      const sheen = hull(shape.sheen.map((point) => flat(project(point))))
      const fill = tone(shape.paint, fogged ? fogFor(depth) : 0)
      return (
        <g key={key}>
          <polygon points={pointsAttr(outline)} fill={GAP} stroke={GAP} strokeWidth={GAP_WIDTH * 2} strokeLinejoin="round" />
          <polygon points={pointsAttr(outline)} fill={fill} />
          <polygon points={pointsAttr(sheen)} fill={SHEEN} />
        </g>
      )
    }
    case 'disc': {
      const center = project(shape.center)
      const half = shape.thickness / 2
      const front = dot(shape.axis, project.toCamera) >= 0 ? 1 : -1
      const faceCenter = add(shape.center, scale(shape.axis, front * half))
      const backCenter = add(shape.center, scale(shape.axis, -front * half))
      const face = circle(faceCenter, shape.axis, shape.radius).map((point) => flat(project(point)))
      const back = circle(backCenter, shape.axis, shape.radius).map((point) => flat(project(point)))
      const hub = circle(faceCenter, shape.axis, shape.radius * 0.22, 10).map((point) => flat(project(point)))
      const fog = fogged ? fogFor(center.depth) : 0
      return (
        <g key={key}>
          <polygon points={pointsAttr(hull([...face, ...back]))} fill={tone(shape.paint, fog + 22)} stroke={GAP} strokeWidth={GAP_WIDTH} strokeLinejoin="round" />
          <polygon points={pointsAttr(face)} fill={tone(shape.paint, fog)} />
          <polygon points={pointsAttr(hub)} fill={GAP} />
        </g>
      )
    }
    case 'box': {
      const [x0, y0, z0] = shape.min
      const [x1, y1, z1] = shape.max
      const corners: Vec3[] = [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z): Vec3 => [x, y, z])))
      const top: Vec3[] = [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ]
      return (
        <g key={key}>
          <polygon
            points={pointsAttr(hull(corners.map((point) => flat(project(point)))))}
            fill={`color-mix(in srgb, var(${TOKEN[shape.paint]}) 72%, var(--figure-gear))`}
          />
          <polygon points={pointsAttr(top.map((point) => flat(project(point))))} fill={tone(shape.paint)} />
        </g>
      )
    }
  }
}

/** Static drawing of one frame; `ExerciseAnimation` re-renders it with a new skeleton per frame. */
export function ExerciseFigure({
  spec,
  skeleton,
  camera,
  layout,
}: {
  spec: ExerciseAnimationSpec
  skeleton: Skeleton
  camera: Camera
  layout: StageLayout
}) {
  const id = useId()
  const project = projector(camera, layout.framing)
  const scene = buildScene(spec, skeleton)

  const rank = bodyRank(scene, project)
  // Furniture keeps its order: the body always rests on top of it.
  const props = scene.props.map((shape, index) => renderShape(shape, project, String(index), false, rank))
  const body = paintOrder(scene.body, rank, project.eye).map(({ shape, key }) => renderShape(shape, project, key, true, rank))

  return (
    <svg viewBox={`0 0 ${STAGE} ${STAGE}`} className="size-full" aria-hidden>
      <Floor id={id} project={project} layout={layout} />
      <Shadow id={id} project={project} shapes={[...scene.props, ...scene.body]} />
      {props}
      {body}
    </svg>
  )
}

/** One capsule end on screen: rounded, rounded without outline (`attached`), or a joint. */
type EndSpec = 'round' | 'attached' | { from: Point2; next: Point2; nextHalf: number; owner: boolean }

const plus = (a: Point2, b: Point2): Point2 => [a[0] + b[0], a[1] + b[1]]
const minus = (a: Point2, b: Point2): Point2 => [a[0] - b[0], a[1] - b[1]]
const times = (a: Point2, factor: number): Point2 => [a[0] * factor, a[1] * factor]
const cross2 = (a: Point2, b: Point2) => a[0] * b[1] - a[1] * b[0]
const unit2 = (a: Point2): Point2 | null => {
  const size = Math.hypot(a[0], a[1])
  return size < 0.5 ? null : [a[0] / size, a[1] / size]
}
const at = ([x, y]: Point2) => `${x.toFixed(2)},${y.toFixed(2)}`

interface JointCut {
  inner: Point2
  outer: Point2
  /** Rounded outside of the bend (joint first), drawn by the owning segment. */
  pie: Point2[] | null
}

/**
 * Splits a joint between two segments without overlap. Each side ends at the inner corner (where
 * both inner edges meet) and straight across on the outside; the owner fills the rounded outside
 * of the bend. Both segments compute the same corner, so the joint looks the same whichever is
 * painted last. `null` when it can't be split cleanly (seen end-on, or folded back on itself).
 */
function cutJoint(joint: Point2, from: Point2, half: number, next: Point2, nextHalf: number, owner: boolean): JointCut | null {
  const u = unit2(minus(joint, from))
  const v = unit2(minus(next, joint))
  if (!u || !v || u[0] * v[0] + u[1] * v[1] < -0.85) return null
  const turn = cross2(u, v)
  const side = turn >= 0 ? 1 : -1
  const inner = times([-u[1], u[0]], side)
  const nextInner = times([-v[1], v[0]], side)
  let corner = plus(joint, times(inner, half))
  if (Math.abs(turn) > 0.08) {
    // Where the two inner edges cross, unless that lies beyond either segment (strong foreshortening).
    const ownEdge = plus(joint, times(inner, half))
    const nextEdge = plus(joint, times(nextInner, nextHalf))
    const meet = plus(ownEdge, times(u, cross2(minus(nextEdge, ownEdge), v) / turn))
    const limit = Math.min(Math.hypot(...minus(joint, from)), Math.hypot(...minus(next, joint)), 2.5 * Math.max(half, nextHalf))
    if (Math.hypot(...minus(meet, joint)) < limit) corner = meet
  }
  let pie: Point2[] | null = null
  if (owner) {
    const start = Math.atan2(-inner[1], -inner[0])
    const sweep = ((Math.atan2(-nextInner[1], -nextInner[0]) - start + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
    pie = [
      joint,
      ...Array.from({ length: 7 }, (_, index): Point2 => {
        const t = index / 6
        const radius = half + (nextHalf - half) * t
        return [joint[0] + Math.cos(start + sweep * t) * radius, joint[1] + Math.sin(start + sweep * t) * radius]
      }),
    ]
  }
  return { inner: corner, outer: plus(joint, times(inner, -half)), pie }
}

function Capsule({ a, b, half, start, end, fill }: { a: Point2; b: Point2; half: number; start: EndSpec; end: EndSpec; fill: string }) {
  const axis = unit2(minus(b, a))
  // Normal toward the light; a segment pointing straight at the camera has none, use the light.
  let light: Point2 = axis ? [-axis[1], axis[0]] : [LIGHT[0], LIGHT[1]]
  if (light[0] * LIGHT[0] + light[1] * LIGHT[1] < 0) light = times(light, -1)
  const cuts = { start: null as JointCut | null, end: null as JointCut | null }
  if (axis && typeof start === 'object') cuts.start = cutJoint(a, start.from, half, start.next, start.nextHalf, start.owner)
  if (axis && typeof end === 'object') cuts.end = cutJoint(b, end.from, half, end.next, end.nextHalf, end.owner)

  // The sheen stops short of a cut joint, so it never reaches into the neighbor.
  const shorten = (point: Point2, toward: Point2, cut: JointCut | null) => (cut && axis ? plus(point, times(minus(toward, point), Math.min(0.45, half / Math.hypot(...minus(toward, point))))) : point)
  const sheenFrom = plus(shorten(a, b, cuts.start), times(light, half * 0.4))
  const sheenTo = plus(shorten(b, a, cuts.end), times(light, half * 0.4))
  const sheen = <line x1={sheenFrom[0]} y1={sheenFrom[1]} x2={sheenTo[0]} y2={sheenTo[1]} stroke={SHEEN} strokeWidth={half * 0.64} strokeLinecap="round" />

  if (!axis) {
    return (
      <g>
        <circle cx={a[0]} cy={a[1]} r={half + GAP_WIDTH} fill={GAP} />
        <circle cx={a[0]} cy={a[1]} r={half} fill={fill} />
        {sheen}
      </g>
    )
  }

  // Outline: left side, end, right side, start (left = +normal).
  const normal: Point2 = [-axis[1], axis[0]]
  const corners = (point: Point2, cut: JointCut | null): [Point2, Point2] => {
    if (!cut) return [plus(point, times(normal, half)), plus(point, times(normal, -half))]
    const innerOnLeft = (cut.inner[0] - point[0]) * normal[0] + (cut.inner[1] - point[1]) * normal[1] > 0
    return innerOnLeft ? [cut.inner, cut.outer] : [cut.outer, cut.inner]
  }
  const [startLeft, startRight] = corners(a, cuts.start)
  const [endLeft, endRight] = corners(b, cuts.end)
  const arc = (to: Point2) => `A${half.toFixed(2)},${half.toFixed(2)} 0 0 0 ${at(to)}`
  const endPath = cuts.end ? `L${at(b)} L${at(endRight)}` : end === 'attached' ? `L${at(endRight)}` : arc(endRight)
  const startPath = cuts.start ? `L${at(a)} L${at(startLeft)}` : start === 'attached' ? `L${at(startLeft)}` : arc(startLeft)
  const outline = `M${at(startLeft)} L${at(endLeft)} ${endPath} L${at(startRight)} ${startPath}Z`

  // The background-colored rim follows the outside only: never across a joint cut.
  const rim = [`M${at(startLeft)} L${at(endLeft)}`, `M${at(endRight)} L${at(startRight)}`]
  if (!cuts.end && end !== 'attached') rim.push(`M${at(endLeft)} ${arc(endRight)}`)
  if (!cuts.start && start !== 'attached') rim.push(`M${at(startRight)} ${arc(startLeft)}`)
  const pies = [cuts.start?.pie, cuts.end?.pie].filter((pie): pie is Point2[] => Boolean(pie))
  for (const pie of pies) rim.push(`M${pie.slice(1).map(at).join(' L')}`)

  return (
    <g>
      <path d={rim.join(' ')} fill="none" stroke={GAP} strokeWidth={GAP_WIDTH * 2} strokeLinejoin="round" />
      {/* A hairline in the fill color closes the anti-aliasing seam along the cuts. */}
      <path d={outline} fill={fill} stroke={fill} strokeWidth={0.6} strokeLinejoin="round" />
      {pies.map((pie, index) => (
        <polygon key={index} points={pointsAttr(pie)} fill={fill} stroke={fill} strokeWidth={0.6} strokeLinejoin="round" />
      ))}
      {sheen}
    </g>
  )
}

function Ball({ at, radius, fill }: { at: Point2; radius: number; fill: string }) {
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r={radius + GAP_WIDTH} fill={GAP} />
      <circle cx={at[0]} cy={at[1]} r={radius} fill={fill} />
      <circle cx={at[0] + LIGHT[0] * radius * 0.36} cy={at[1] + LIGHT[1] * radius * 0.36} r={radius * 0.42} fill={SHEEN} />
    </g>
  )
}

/** A round platform with a grid that turns with the camera: the clearest cue for the angle. */
function Floor({ id, project, layout }: { id: string; project: Projector; layout: StageLayout }) {
  const { center, radius } = layout.floor
  const disc = circle(center, [0, 1, 0], radius, 48).map((point) => flat(project(point)))
  const spacing = 15
  const lines: [Point2, Point2][] = []
  for (let offset = -Math.floor(radius / spacing) * spacing; offset <= radius; offset += spacing) {
    const half = Math.sqrt(radius ** 2 - offset ** 2)
    const at = (dx: number, dz: number) => flat(project([center[0] + dx, 0, center[2] + dz]))
    lines.push([at(offset, -half), at(offset, half)], [at(-half, offset), at(half, offset)])
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-fade`}>
          <stop offset="0" stopColor="white" />
          <stop offset="0.6" stopColor="white" stopOpacity="0.7" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-floor`}>
          <polygon points={pointsAttr(disc)} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-floor)`}>
        <polygon points={pointsAttr(disc)} fill="var(--figure-ground)" opacity={0.4} />
        {lines.map(([a, b], index) => (
          <line key={index} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--figure-ground)" strokeWidth={0.9} />
        ))}
      </g>
    </g>
  )
}

/** Soft shadow straight below everything (light from above), so the figure stands on the floor. */
function Shadow({ id, project, shapes }: { id: string; project: Projector; shapes: Shape[] }) {
  const footprint = hull(scenePoints({ props: [], body: shapes }).map(([point]): Point2 => [point[0], point[2]]))
  const outline = footprint.map(([x, z]) => flat(project([x, 0, z])))
  return (
    <g>
      <defs>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      <polygon points={pointsAttr(outline)} fill="var(--figure-shadow)" filter={`url(#${id}-blur)`} />
    </g>
  )
}
