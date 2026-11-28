import { animate, useReducedMotion, type AnimationPlaybackControls } from 'framer-motion'
import { Pause, Play, Rotate3d } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useT } from '../../i18n'
import type { Exercise } from '../../types/models'
import { ExerciseAnimation } from './animation/ExerciseAnimation'
import { EXERCISE_ANIMATIONS, hasSecondaryHighlight, type ExerciseAnimationSpec } from './animation/poses'

/** Shortest signed turn from one angle to another, in degrees (-180…180). */
const turn = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180

/** Degrees the figure turns per pixel dragged. */
const DRAG_DEGREES = 0.6

/**
 * Looping demo of one repetition with a legend for the highlighted muscles and pause. The
 * figure turns by dragging sideways (or arrow keys); the presets glide to fixed angles. Used by
 * the catalog's detail sheet and the expanded rows of the exercise picker.
 */
export function AnimationStage({ exercise, className = '' }: { exercise: Exercise; className?: string }) {
  const spec = EXERCISE_ANIMATIONS[exercise.id] as ExerciseAnimationSpec | undefined
  const [paused, setPaused] = useState(false)
  const [yaw, setYaw] = useState(spec?.camera.yaw ?? 0)
  const [turned, setTurned] = useState(false)
  const drag = useRef<{ x: number; yaw: number } | null>(null)
  const glide = useRef<AnimationPlaybackControls | null>(null)
  const reduceMotion = useReducedMotion()
  const t = useT()
  useEffect(() => () => glide.current?.stop(), [])
  if (!spec) return null

  const views = [
    { id: 'angled', label: t.exercises.viewAngled, yaw: spec.camera.yaw },
    { id: 'front', label: t.exercises.viewFront, yaw: 0 },
    { id: 'side', label: t.exercises.viewSide, yaw: -90 },
  ]
  const turnTo = (target: number) => {
    glide.current?.stop()
    const end = yaw + turn(yaw, target)
    if (reduceMotion) setYaw(end)
    else glide.current = animate(yaw, end, { duration: 0.6, ease: [0.22, 1, 0.36, 1], onUpdate: setYaw })
  }
  const rotateBy = (degrees: number) => {
    glide.current?.stop()
    setYaw((value) => value + degrees)
    setTurned(true)
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-sunken ${className}`}>
      <div className="relative flex justify-center px-4 pt-3">
        <div role="group" aria-label={t.exercises.viewAngle} className="flex rounded-full bg-surface-solid/70 p-0.5 text-[12px] font-semibold shadow-soft">
          {views.map((view) => {
            const active = Math.abs(turn(yaw, view.yaw)) < 1
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => turnTo(view.yaw)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 transition ${active ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
              >
                {view.label}
              </button>
            )
          })}
        </div>
      </div>
      <div
        tabIndex={0}
        aria-label={t.exercises.rotateFigure}
        className="relative mx-auto aspect-square w-full max-w-72 cursor-grab touch-pan-y rounded-3xl outline-none select-none focus-visible:ring-2 focus-visible:ring-fg/40 active:cursor-grabbing"
        onPointerDown={(event) => {
          glide.current?.stop()
          drag.current = { x: event.clientX, yaw }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (!drag.current) return
          const dx = event.clientX - drag.current.x
          setYaw(drag.current.yaw - dx * DRAG_DEGREES)
          if (Math.abs(dx) > 4) setTurned(true)
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') rotateBy(15)
          if (event.key === 'ArrowRight') rotateBy(-15)
        }}
      >
        <ExerciseAnimation exerciseId={exercise.id} playing={!paused} camera={{ yaw, pitch: spec.camera.pitch }} label={t.exercises.animation(exercise.name)} />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-1 flex justify-center transition-opacity duration-500 ${turned ? 'opacity-0' : 'opacity-100'}`}
        >
          <span className="flex items-center gap-1.5 rounded-full bg-surface-solid/80 px-2.5 py-1 text-[11px] font-semibold text-muted shadow-soft">
            <Rotate3d className="size-3.5" />
            {t.exercises.dragToRotate}
          </span>
        </span>
      </div>
      <div className="relative flex items-center justify-between gap-3 px-4 pb-3.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-(--figure-highlight)" />
            {t.exercises.targetMuscle}
          </span>
          {hasSecondaryHighlight(exercise.id) && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-(--figure-highlight-soft)" />
              {t.exercises.supporting}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-solid text-fg shadow-soft transition hover:scale-105 active:scale-95"
          aria-label={paused ? t.exercises.playAnimation : t.exercises.pauseAnimation}
          title={paused ? t.exercises.play : t.exercises.pause}
        >
          {paused ? <Play className="size-4 translate-x-px" fill="currentColor" /> : <Pause className="size-4" fill="currentColor" />}
        </button>
      </div>
    </div>
  )
}
