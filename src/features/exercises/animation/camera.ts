import { add, dot, scale, sub, type Vec3 } from './rig'

/**
 * Virtual camera orbiting the figure, in degrees. `yaw` 0 looks at the figure's front, -90 at
 * its side (facing right on screen); `pitch` is how far it looks down.
 */
export interface Camera {
  yaw: number
  pitch: number
}

/** What the projection centers on and how large it draws (output: a 200 × 200 stage). */
export interface Framing {
  center: Vec3
  zoom: number
  /** Shift on screen (zoom-1 units) that centers the drawing for a fixed camera. */
  offset: readonly [number, number]
}

export interface Projected {
  x: number
  y: number
  /** Toward the camera, relative to the framing center (world units). */
  depth: number
  /** Screen units per world unit at this point (perspective). */
  scale: number
}

export interface Projector {
  (point: Vec3): Projected
  /** Unit vector from the scene toward the camera. */
  toCamera: Vec3
  /** Where the camera is (world space). */
  eye: Vec3
}

export const STAGE = 200
/** Distance from the camera to the framing center: lower = stronger perspective. */
const FOCAL = 520

function axes({ yaw, pitch }: Camera) {
  const y = (yaw * Math.PI) / 180
  const p = (pitch * Math.PI) / 180
  const toCamera: Vec3 = [Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)]
  const right: Vec3 = [Math.cos(y), 0, -Math.sin(y)]
  const up: Vec3 = [-Math.sin(y) * Math.sin(p), Math.cos(p), -Math.cos(y) * Math.sin(p)]
  return { toCamera, right, up }
}

export function projector(camera: Camera, framing: Framing): Projector {
  const { toCamera, right, up } = axes(camera)
  const { center, zoom, offset } = framing
  const project = (point: Vec3): Projected => {
    const relative = sub(point, center)
    const depth = dot(relative, toCamera)
    const perspective = FOCAL / (FOCAL - depth)
    return {
      x: STAGE / 2 + (dot(relative, right) * perspective - offset[0]) * zoom,
      y: STAGE / 2 - (dot(relative, up) * perspective - offset[1]) * zoom,
      depth,
      scale: perspective * zoom,
    }
  }
  return Object.assign(project, { toCamera, eye: add(center, scale(toCamera, FOCAL)) })
}

/** A point of the scene with the radius it is drawn with (half the stroke width). */
export type ScenePoint = readonly [point: Vec3, radius: number]

function boundsCenter(points: ScenePoint[]): Vec3 {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const [point] of points) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], point[axis])
      max[axis] = Math.max(max[axis], point[axis])
    }
  }
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
}

/**
 * Same size from every angle: fits the bounding sphere, so turning the camera never zooms.
 * `fill` is the share of the stage the sphere may cover.
 */
export function orbitFraming(points: ScenePoint[], fill: number): Framing {
  const center = boundsCenter(points)
  const radius = Math.max(...points.map(([point, extra]) => Math.hypot(...sub(point, center)) + extra))
  return { center, zoom: (STAGE / 2) * fill / ((radius * FOCAL) / (FOCAL - radius)), offset: [0, 0] }
}

/** Tightest fit for one fixed camera (thumbnails), centered on the drawing. */
export function cameraFraming(points: ScenePoint[], camera: Camera, fill: number): Framing {
  const center = boundsCenter(points)
  const project = projector(camera, { center, zoom: 1, offset: [0, 0] })
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [point, extra] of points) {
    const { x, y, scale } = project(point)
    minX = Math.min(minX, x - extra * scale)
    maxX = Math.max(maxX, x + extra * scale)
    minY = Math.min(minY, y - extra * scale)
    maxY = Math.max(maxY, y + extra * scale)
  }
  const half = Math.max(maxX - minX, maxY - minY) / 2
  // Screen y grows downward, the offset is applied in the camera's up direction.
  return {
    center,
    zoom: (STAGE / 2) * fill / half,
    offset: [(minX + maxX) / 2 - STAGE / 2, STAGE / 2 - (minY + maxY) / 2],
  }
}
