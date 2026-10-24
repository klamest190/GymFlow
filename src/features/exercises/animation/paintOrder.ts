import type { Projector } from './camera'
import { add, dot, scale, sub, type Vec3 } from './rig'
import type { Scene, Shape } from './scene'

/** Depth of a point for the painting order: larger = nearer the camera. */
export type Rank = (point: Vec3) => number

/** Depth difference below which two parts count as level and keep the scene's order. */
const LEVEL = 0.05

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

/**
 * Depth around the spine (`Scene.axis`): how far a point sticks out toward the camera, without
 * the part that only comes from sitting higher or lower along the spine. With the camera tilted,
 * an arm hanging beside the chest would otherwise rank behind it only for being lower. Looking
 * (almost) along the spine, that part is the depth itself, so it fades back in.
 */
export function bodyRank({ axis }: Pick<Scene, 'axis'>, project: Projector): Rank {
  const tilt = dot(axis.direction, project.toCamera)
  const ignored = tilt * (1 - smoothstep(0.35, 0.75, Math.abs(tilt)))
  return (point) => project(point).depth - dot(sub(point, axis.origin), axis.direction) * ignored
}

/** Painting order key of one shape (a group goes by its first part). */
export function paintDepth(shape: Shape, rank: Rank): number {
  switch (shape.kind) {
    case 'group':
    case 'seam':
      return paintDepth(shape.shapes[0], rank)
    case 'capsule':
      return (rank(shape.a) + rank(shape.b)) / 2
    case 'sphere':
      return rank(shape.center) + (shape.bias ?? 0)
    case 'hull':
      return shape.points.reduce((sum, point) => sum + rank(point), 0) / shape.points.length + (shape.bias ?? 0)
    case 'disc':
      return rank(shape.center)
    case 'box':
      return rank(scale(add(shape.min, shape.max), 0.5))
  }
}

export interface PaintItem {
  shape: Shape
  /** Stable React key: the place in the scene. */
  key: string
  depth: number
}

/**
 * Shapes back to front. A seam is split into its two parts, sorted on their own; the covering part
 * is moved forward if needed.
 */
export function paintOrder(shapes: readonly Shape[], rank: Rank, eye: Vec3): PaintItem[] {
  const items = shapes.flatMap((shape, index): PaintItem[] => {
    if (shape.kind !== 'seam') return [{ shape, key: String(index), depth: paintDepth(shape, rank) }]
    const [first, second] = shape.shapes
    let [front, back] = [paintDepth(second, rank), paintDepth(first, rank)]
    const secondFaces = !shape.plane || dot(shape.plane.normal, sub(eye, shape.plane.at)) >= 0
    if (!secondFaces) [front, back] = [back, front]
    front = Math.max(front, back + 2 * LEVEL)
    const [firstDepth, secondDepth] = secondFaces ? [back, front] : [front, back]
    return [
      { shape: first, key: `${index}a`, depth: firstDepth },
      { shape: second, key: `${index}b`, depth: secondDepth },
    ]
  })
  return backToFront(items, (item) => item.depth)
}

/**
 * Back to front. Parts at (nearly) the same depth keep the given order: a hand on its handle, or a
 * folded arm seen from the side, would otherwise swap places from frame to frame.
 */
export function backToFront<T>(items: T[], depth: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, key: depth(item) }))
    .sort((a, b) => (Math.abs(a.key - b.key) < LEVEL ? 0 : a.key - b.key))
    .map(({ item }) => item)
}
