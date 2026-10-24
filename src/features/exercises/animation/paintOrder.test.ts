import { describe, expect, it } from 'vitest'
import { projector } from './camera'
import { backToFront, bodyRank, paintOrder, type Rank } from './paintOrder'
import { EXERCISE_ANIMATIONS, skeletonAt } from './poses'
import type { Vec3 } from './rig'
import { buildScene, stageLayout, type Shape } from './scene'

const FRAMES = 600

/** Every drawn part in painting order, including the parts of sorted groups (hand and dumbbell). */
function sequence(shapes: readonly Shape[], rank: Rank, eye: Vec3): string[] {
  return paintOrder(shapes, rank, eye).flatMap(({ shape, key }) =>
    shape.kind === 'group' && shape.sorted ? sequence(shape.shapes, rank, eye).map((inner) => `${key}.${inner}`) : [key],
  )
}

describe('painting order', () => {
  it('keeps nearly level parts in their given order', () => {
    const depth = { a: 1.02, b: 1, c: 0 }
    expect(backToFront(['a', 'b', 'c'] as const, (item) => depth[item])).toEqual(['c', 'a', 'b'])
  })

  it.each(Object.entries(EXERCISE_ANIMATIONS))('%s never flickers', (_, spec) => {
    const layout = stageLayout(spec, null, 1)
    for (const yaw of [spec.camera.yaw, 0, -90, 90, 180]) {
      const project = projector({ ...spec.camera, yaw }, layout.framing)
      const orders = Array.from({ length: FRAMES + 1 }, (_, frame) => {
        const scene = buildScene(spec, skeletonAt(spec, frame / FRAMES))
        return sequence(scene.body, bodyRank(scene, project), project.eye).join()
      })
      // An order that changes and changes right back is flicker, not one part passing another.
      const flickers = orders.flatMap((order, frame) => (frame >= 2 && order === orders[frame - 2] && order !== orders[frame - 1] ? [frame] : []))
      expect(flickers, `yaw ${yaw}`).toEqual([])
    }
  })
})
