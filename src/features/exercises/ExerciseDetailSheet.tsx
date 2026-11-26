import { animate, useReducedMotion, type AnimationPlaybackControls } from 'framer-motion'
import { Check, Pause, Play, Plus, Rotate3d } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import { MUSCLE_GROUP_TINTS } from '../../data/muscleGroups'
import { formatDaysAgo } from '../../lib/dates'
import { useT } from '../../i18n'
import { bestReps, bestWeight, formatKg, summarizeSets, type ExerciseSession } from '../../lib/exerciseHistory'
import type { Exercise } from '../../types/models'
import { ExerciseAnimation } from './animation/ExerciseAnimation'
import { InstructionSteps } from './InstructionSteps'
import { EXERCISE_ANIMATIONS, hasSecondaryHighlight, type ExerciseAnimationSpec } from './animation/poses'

interface ExerciseDetailSheetProps {
  exercise: Exercise | null
  onClose: () => void
  sessions: ExerciseSession[]
  historyDays: number
  addedToday: boolean
  onAddToToday: (exercise: Exercise) => void
}

export function ExerciseDetailSheet({ exercise, onClose, sessions, historyDays, addedToday, onAddToToday }: ExerciseDetailSheetProps) {
  // Keep the last exercise around while the sheet animates out.
  const [shown, setShown] = useState(exercise)
  const t = useT()
  if (exercise && exercise !== shown) setShown(exercise)
  if (!shown) return null

  const best = bestWeight(sessions)
  const bestSet = bestReps(sessions)
  const meta = [
    t.catalog.muscles[shown.primaryMuscle],
    t.catalog.equipment[shown.equipment],
    t.catalog.categories[shown.category],
    t.catalog.difficulty[shown.difficulty],
  ]

  return (
    <Sheet
      open={exercise !== null}
      onClose={onClose}
      title={shown.name}
      subtitle={meta.join(', ')}
      footer={
        <button
          type="button"
          disabled={addedToday}
          onClick={() => onAddToToday(shown)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {addedToday ? <Check className="size-4.5" strokeWidth={3} /> : <Plus className="size-4.5" strokeWidth={3} />}
          {addedToday ? t.exercises.addedToday : t.exercises.addToToday}
        </button>
      }
    >
      <div className="space-y-6 pb-2">
        <AnimationStage key={shown.id} exercise={shown} />

        <Section title={t.exercises.muscleGroups}>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-semibold">
              <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[shown.primaryMuscle]}`} />
              {t.catalog.muscles[shown.primaryMuscle]}
              <span className="font-medium text-muted">{t.exercises.primary}</span>
            </span>
            {shown.secondaryMuscles.map((muscle) => (
              <span key={muscle} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-medium text-muted">
                <span className={`size-2 rounded-full opacity-60 ${MUSCLE_GROUP_TINTS[muscle]}`} />
                {t.catalog.muscles[muscle]}
              </span>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={`${shown.defaultSets} × ${shown.defaultReps}`} label={t.exercises.recommended} />
          <Stat value={String(sessions.length)} label={t.exercises.timesInDays(historyDays)} />
          {shown.usesWeight ? (
            <Stat value={best !== null ? formatKg(best) : '–'} label={t.exercises.bestPerDumbbell} />
          ) : (
            <Stat value={bestSet !== null ? t.common.repsValue(bestSet) : '–'} label={t.exercises.bestSet} />
          )}
        </div>

        <Section title={t.exercises.execution}>
          <p className="text-[15px] font-medium leading-relaxed">{shown.description}</p>
          <InstructionSteps instructions={shown.instructions} className="mt-3 text-[15px] leading-relaxed text-fg/85" />
        </Section>

        <Section title={t.exercises.formCues}>
          <ul className="space-y-2">
            {shown.formCues.map((cue) => (
              <li key={cue} className="flex items-start gap-2.5 text-[15px]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                  <Check className="size-3" strokeWidth={3.5} />
                </span>
                {cue}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.exercises.breathing}>
          <p className="text-[15px] font-medium leading-relaxed">{shown.breathing}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg/80">{t.catalog.breathingRule}</p>
        </Section>

        <Section title={t.exercises.history}>
          {sessions.length === 0 ? (
            <p className="text-[15px] text-muted">{t.exercises.notTrainedInDays(historyDays)}</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken">
              {sessions.slice(0, 6).map(({ date, entry }) => (
                <li key={`${date}-${entry.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-[15px]">
                  <span className="font-medium">{formatDaysAgo(date)}</span>
                  <span className="text-muted tabular-nums">{summarizeSets(entry)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </Sheet>
  )
}

/** Shortest signed turn from one angle to another, in degrees (-180…180). */
const turn = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180

/** Degrees the figure turns per pixel dragged. */
const DRAG_DEGREES = 0.6

/**
 * Looping demo of one repetition with a legend for the highlighted muscles and pause. The
 * figure turns by dragging sideways (or arrow keys); the presets glide to fixed angles.
 */
function AnimationStage({ exercise }: { exercise: Exercise }) {
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
    <div className="relative overflow-hidden rounded-3xl bg-sunken">
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-sunken p-3">
      <div className="numeral truncate text-[25px] leading-none">{value}</div>
      <div className="mt-0.5 truncate text-[12px] font-medium text-muted">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-[13px] font-semibold text-muted">{title}</h3>
      {children}
    </section>
  )
}
