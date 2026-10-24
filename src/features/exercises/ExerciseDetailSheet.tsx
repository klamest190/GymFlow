import { animate, useReducedMotion, type AnimationPlaybackControls } from 'framer-motion'
import { Check, Pause, Play, Plus, Rotate3d } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_TINTS,
} from '../../data/muscleGroups'
import { formatDaysAgo } from '../../lib/dates'
import { bestWeight, formatKg, summarizeSets, type ExerciseSession } from '../../lib/exerciseHistory'
import type { Exercise } from '../../types/models'
import { ExerciseAnimation } from './animation/ExerciseAnimation'
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
  if (exercise && exercise !== shown) setShown(exercise)
  if (!shown) return null

  const best = bestWeight(sessions)
  const meta = [
    MUSCLE_GROUP_LABELS[shown.primaryMuscle],
    EQUIPMENT_LABELS[shown.equipment],
    CATEGORY_LABELS[shown.category],
    DIFFICULTY_LABELS[shown.difficulty],
  ]

  return (
    <Sheet
      open={exercise !== null}
      onClose={onClose}
      title={shown.name}
      subtitle={meta.join(' · ')}
      footer={
        <button
          type="button"
          disabled={addedToday}
          onClick={() => onAddToToday(shown)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {addedToday ? <Check className="size-4.5" strokeWidth={3} /> : <Plus className="size-4.5" strokeWidth={3} />}
          {addedToday ? 'Heute eingetragen' : 'Zu heute hinzufügen'}
        </button>
      }
    >
      <div className="space-y-6 pb-2">
        <AnimationStage key={shown.id} exercise={shown} />

        <Section title="Muskelgruppen">
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-semibold">
              <span className={`size-2 rounded-full ${MUSCLE_GROUP_TINTS[shown.primaryMuscle]}`} />
              {MUSCLE_GROUP_LABELS[shown.primaryMuscle]}
              <span className="font-medium text-muted">primär</span>
            </span>
            {shown.secondaryMuscles.map((muscle) => (
              <span key={muscle} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-medium text-muted">
                <span className={`size-2 rounded-full opacity-60 ${MUSCLE_GROUP_TINTS[muscle]}`} />
                {MUSCLE_GROUP_LABELS[muscle]}
              </span>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-3 gap-2">
          <Stat value={`${shown.defaultSets} × ${shown.defaultReps}`} label="Standard" />
          <Stat value={String(sessions.length)} label={`Mal in ${historyDays} T.`} />
          <Stat value={best !== null ? formatKg(best) : '–'} label="Best je Hantel" />
        </div>

        <Section title="Ausführung">
          <p className="text-[15px] font-medium leading-relaxed">{shown.description}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-fg/80">{shown.instructions}</p>
        </Section>

        <Section title="Technik-Hinweise">
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

        <Section title="Verlauf">
          {sessions.length === 0 ? (
            <p className="text-[15px] text-muted">In den letzten {historyDays} Tagen noch nicht trainiert.</p>
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
  useEffect(() => () => glide.current?.stop(), [])
  if (!spec) return null

  const views = [
    { label: 'Schräg', yaw: spec.camera.yaw },
    { label: 'Vorne', yaw: 0 },
    { label: 'Seite', yaw: -90 },
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
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--glow-a),transparent_60%)]" />
      <div className="relative flex justify-center px-4 pt-3">
        <div role="group" aria-label="Blickwinkel" className="flex rounded-full bg-surface-solid/70 p-0.5 text-[12px] font-semibold shadow-soft">
          {views.map((view) => {
            const active = Math.abs(turn(yaw, view.yaw)) < 1
            return (
              <button
                key={view.label}
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
        aria-label="Figur drehen: ziehen oder Pfeiltasten"
        className="relative mx-auto aspect-square w-full max-w-72 cursor-grab touch-pan-y rounded-3xl outline-none select-none focus-visible:ring-2 focus-visible:ring-accent/70 active:cursor-grabbing"
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
        <ExerciseAnimation exerciseId={exercise.id} playing={!paused} camera={{ yaw, pitch: spec.camera.pitch }} label={`Animation: ${exercise.name}`} />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-1 flex justify-center transition-opacity duration-500 ${turned ? 'opacity-0' : 'opacity-100'}`}
        >
          <span className="flex items-center gap-1.5 rounded-full bg-surface-solid/80 px-2.5 py-1 text-[11px] font-semibold text-muted shadow-soft">
            <Rotate3d className="size-3.5" />
            Zum Drehen ziehen
          </span>
        </span>
      </div>
      <div className="relative flex items-center justify-between gap-3 px-4 pb-3.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-(--figure-highlight)" />
            Zielmuskel
          </span>
          {hasSecondaryHighlight(exercise.id) && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-(--figure-highlight-soft)" />
              Unterstützend
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-solid text-fg shadow-soft transition hover:scale-105 active:scale-95"
          aria-label={paused ? 'Animation abspielen' : 'Animation anhalten'}
          title={paused ? 'Abspielen' : 'Anhalten'}
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
      <div className="truncate text-[20px] font-bold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 truncate text-[12px] font-medium text-muted">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      {children}
    </section>
  )
}
