import { useId, type ReactNode } from 'react'
import { STAGE, projector, type Camera, type Projected, type Projector } from './camera'
import type { ExerciseAnimationSpec } from './poses'
import { add, cross, dot, normalize, scale, sub, type Skeleton, type Vec3 } from './rig'
import { buildScene, scenePoints, type Paint, type Shape, type StageLayout } from './scene'

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

const pointsAttr = (points: readonly Point2[]) => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
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

/** Depth used for painting order, and the drawing of one shape. */
function renderShape(shape: Shape, project: Projector, key: number, fogged: boolean): { depth: number; node: ReactNode } {
  switch (shape.kind) {
    case 'capsule': {
      const a = project(shape.a)
      const b = project(shape.b)
      const depth = (a.depth + b.depth) / 2
      const width = shape.radius * (a.scale + b.scale)
      return { depth, node: <Capsule key={key} a={flat(a)} b={flat(b)} width={width} fill={tone(shape.paint, fogged ? fogFor(depth) : 0)} /> }
    }
    case 'sphere': {
      const center = project(shape.center)
      const fill = tone(shape.paint, fogged ? fogFor(center.depth) : 0)
      return { depth: center.depth, node: <Ball key={key} at={flat(center)} radius={shape.radius * center.scale} fill={fill} /> }
    }
    case 'hull': {
      const projected = shape.points.map(project)
      const depth = projected.reduce((sum, point) => sum + point.depth, 0) / projected.length
      const outline = hull(projected.map(flat))
      const sheen = hull(shape.sheen.map((point) => flat(project(point))))
      const fill = tone(shape.paint, fogged ? fogFor(depth) : 0)
      return {
        depth: depth + (shape.bias ?? 0),
        node: (
          <g key={key}>
            <polygon points={pointsAttr(outline)} fill={GAP} stroke={GAP} strokeWidth={GAP_WIDTH * 2} strokeLinejoin="round" />
            <polygon points={pointsAttr(outline)} fill={fill} />
            <polygon points={pointsAttr(sheen)} fill={SHEEN} />
          </g>
        ),
      }
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
      return {
        depth: center.depth,
        node: (
          <g key={key}>
            <polygon points={pointsAttr(hull([...face, ...back]))} fill={tone(shape.paint, fog + 22)} stroke={GAP} strokeWidth={GAP_WIDTH} strokeLinejoin="round" />
            <polygon points={pointsAttr(face)} fill={tone(shape.paint, fog)} />
            <polygon points={pointsAttr(hub)} fill={GAP} />
          </g>
        ),
      }
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
      return {
        depth: project(scale(add(shape.min, shape.max), 0.5)).depth,
        node: (
          <g key={key}>
            <polygon
              points={pointsAttr(hull(corners.map((point) => flat(project(point)))))}
              fill={`color-mix(in srgb, var(${TOKEN[shape.paint]}) 72%, var(--figure-gear))`}
            />
            <polygon points={pointsAttr(top.map((point) => flat(project(point))))} fill={tone(shape.paint)} />
          </g>
        ),
      }
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

  const props = scene.props.map((shape, index) => renderShape(shape, project, index, false).node)
  const body = scene.body
    .map((shape, index) => renderShape(shape, project, index, true))
    .sort((a, b) => a.depth - b.depth)
    .map(({ node }) => node)

  return (
    <svg viewBox={`0 0 ${STAGE} ${STAGE}`} className="size-full" aria-hidden>
      <Floor id={id} project={project} layout={layout} />
      <Shadow id={id} project={project} shapes={[...scene.props, ...scene.body]} />
      {props}
      {body}
    </svg>
  )
}

function Capsule({ a, b, width, fill }: { a: Point2; b: Point2; width: number; fill: string }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const span = Math.hypot(dx, dy)
  // Normal toward the light; a segment pointing straight at the camera has none, use the light.
  let normal: Point2 = span < 0.01 ? LIGHT : [-dy / span, dx / span]
  if (normal[0] * LIGHT[0] + normal[1] * LIGHT[1] < 0) normal = [-normal[0], -normal[1]]
  const offset = width * 0.2
  const line = (stroke: string, strokeWidth: number, shift = 0) => (
    <line
      x1={a[0] + normal[0] * shift}
      y1={a[1] + normal[1] * shift}
      x2={b[0] + normal[0] * shift}
      y2={b[1] + normal[1] * shift}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  )
  return (
    <g>
      {line(GAP, width + GAP_WIDTH * 2)}
      {line(fill, width)}
      {line(SHEEN, width * 0.32, offset)}
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
