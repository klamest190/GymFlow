import { m, useAnimationFrame, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'
import { Play, Square } from 'lucide-react'
import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import { LazyWaveFigure } from '../exercises/animation/lazyFigures'
import { haptic } from '../../hooks/useUi'
import { useWakeLock } from '../../hooks/useWakeLock'
import { snap } from '../../lib/motion'
import { playCountdownTick, playWaveDone, playWaveStart, playWaveTurn, unlockAudio } from '../../lib/sound'
import { useT, type Messages } from '../../i18n'
import {
  completedReps,
  COUNTDOWN_SECONDS,
  repSeconds,
  waveHeight,
  waveMoment,
  wavePath,
  waveY,
  type WaveGeometry,
  type WaveMoment,
  type WavePlan,
} from '../../lib/tempoWave'

const HEIGHT = 96
const GEOMETRY: WaveGeometry = { pxPerSecond: 40, top: 14, bottom: HEIGHT - 14 }
/** The dot stays here while the wave runs through under it. */
const DOT_X = 64
/** Wave drawn behind and ahead of the current repetition; ahead covers the widest card. */
const BEHIND_SECONDS = 3
const AHEAD_SECONDS = 45

/**
 * The wave as a strip: the curve scrolls from right to left under a dot that moves up and down
 * with the weight. `seconds` is the time since the first repetition started (negative before).
 */
function WaveTrack({ plan, seconds, anchorSeconds }: { plan: WavePlan; seconds: MotionValue<number>; anchorSeconds: number }) {
  const clipId = useId()
  const x = useTransform(seconds, (value) => DOT_X - value * GEOMETRY.pxPerSecond)
  const y = useTransform(seconds, (value) => waveY(GEOMETRY, waveHeight(plan, value)))
  // Only a window around the current repetition is drawn, so a long set costs no more than a short one.
  const path = useMemo(
    () => wavePath(plan, GEOMETRY, anchorSeconds - BEHIND_SECONDS, anchorSeconds + Math.max(repSeconds(plan.tempo), COUNTDOWN_SECONDS) + AHEAD_SECONDS),
    [plan, anchorSeconds],
  )
  return (
    <svg height={HEIGHT} className="block w-full" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={DOT_X} height={HEIGHT} />
        </clipPath>
      </defs>
      {/* The travel of the weight: top and bottom position. */}
      <line x1={0} x2="100%" y1={GEOMETRY.top} y2={GEOMETRY.top} className="stroke-line" strokeDasharray="2 6" />
      <line x1={0} x2="100%" y1={GEOMETRY.bottom} y2={GEOMETRY.bottom} className="stroke-line" strokeDasharray="2 6" />
      <m.g style={{ x }}>
        <path d={path} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="stroke-muted/45" />
      </m.g>
      {/* What is already done, left of the dot, in full graphite. */}
      <g clipPath={`url(#${clipId})`}>
        <m.g style={{ x }}>
          <path d={path} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="stroke-fg" />
        </m.g>
      </g>
      <m.g style={{ y }}>
        <circle cx={DOT_X} cy={0} r={9} strokeWidth={2.5} className="fill-accent stroke-fg" />
      </m.g>
    </svg>
  )
}

const tempoText = (plan: WavePlan, texts: Messages['tracker']) => {
  // No-break spaces: a narrow row wraps after the comma, never inside "3 s senken".
  const lift = texts.lift(plan.tempo.liftSeconds)
  const lower = texts.lower(plan.tempo.lowerSeconds)
  return plan.lowersFirst ? `${lower}, ${lift}` : `${lift}, ${lower}`
}

/** The figure of the exercise in a small frame, moving with `seconds` of the wave. */
function FigureFrame({ exercise, plan, seconds, className }: { exercise: WaveExercise; plan: WavePlan; seconds: MotionValue<number>; className: string }) {
  const t = useT()
  return (
    <span className={`relative shrink-0 overflow-hidden rounded-xl bg-sunken ${className}`}>
      <Suspense fallback={null}>
        <LazyWaveFigure exerciseId={exercise.id} plan={plan} seconds={seconds} label={t.tracker.waveFigure(exercise.name)} />
      </Suspense>
    </span>
  )
}

/** The exercise the wave leads; its figure demonstrates the repetitions. */
export interface WaveExercise {
  id: string
  name: string
}

/**
 * The wave of the open set, standing still, with the button that starts it. The figure next to
 * the tempo repeats one repetition in that tempo, so the pace is clear before the set starts.
 */
export function WavePreview({ plan, exercise, onStart }: { plan: WavePlan; exercise?: WaveExercise; onStart: () => void }) {
  const seconds = useMotionValue(0)
  const demo = useMotionValue(0)
  const t = useT()
  const demoPlan = useMemo(() => ({ ...plan, reps: 1 }), [plan])
  const reduceMotion = useReducedMotion()
  useAnimationFrame((time) => {
    if (exercise && !reduceMotion) demo.set((time / 1000) % repSeconds(plan.tempo))
  })
  return (
    <div className="mt-3 border-t border-line pt-2">
      {/* The figure beside the wave it follows; below, the tempo and the start keep the full width. */}
      <div className="flex items-center gap-3">
        {exercise && <FigureFrame exercise={exercise} plan={demoPlan} seconds={demo} className="size-16" />}
        <div className="min-w-0 flex-1">
          <WaveTrack plan={plan} seconds={seconds} anchorSeconds={0} />
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-medium text-muted">{tempoText(plan, t.tracker)}</p>
        <m.button
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={snap}
          disabled={plan.reps < 1}
          onClick={() => {
            // Inside the tap, so iOS lets the countdown and the turning points play sound.
            unlockAudio()
            haptic()
            onStart()
          }}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-sunken px-4 text-[14px] font-semibold transition-colors hover:bg-fg hover:text-bg disabled:opacity-40 disabled:hover:bg-sunken disabled:hover:text-fg"
        >
          <Play className="size-4" strokeWidth={2.75} />
          {t.tracker.startWave}
        </m.button>
      </div>
    </div>
  )
}

const sameMoment = (a: WaveMoment, b: WaveMoment) =>
  a.phase === b.phase &&
  (a.phase === 'countdown' ? a.secondsLeft === (b as typeof a).secondsLeft : a.phase === 'done' || a.rep === (b as typeof a).rep)

/** Sound and vibration when the wave enters a new second of the countdown, phase or repetition. */
function signal(moment: WaveMoment, previous: WaveMoment) {
  if (moment.phase === 'countdown') {
    if (moment.secondsLeft <= 3) playCountdownTick()
  } else if (moment.phase === 'done') {
    playWaveDone()
    haptic(30)
  } else if (previous.phase === 'countdown') {
    playWaveStart()
    haptic(20)
  } else {
    playWaveTurn(moment.phase === 'lift')
    haptic()
  }
}

/**
 * The running wave: counts down (`COUNTDOWN_SECONDS`, or less with "Jetzt starten"), then leads
 * through every repetition. `onFinish` after the last one; `onStop` with the repetitions done so
 * far when it is ended early.
 */
export function WaveRun({
  plan,
  exercise,
  number,
  startedAt,
  onFinish,
  onStop,
}: {
  plan: WavePlan
  /** Shows its figure doing each repetition together with the wave. */
  exercise?: WaveExercise
  number: number
  /** `Date.now()` of the tap on "Welle starten". */
  startedAt: number
  onFinish: () => void
  onStop: (completedReps: number) => void
}) {
  const seconds = useMotionValue(-COUNTDOWN_SECONDS)
  const t = useT()
  // "Jetzt starten" moves the start back so the countdown ends now; a ref for the frame loop.
  const start = useRef(startedAt)
  const skipCountdown = () => {
    haptic()
    start.current = Math.min(start.current, Date.now() - COUNTDOWN_SECONDS * 1000)
  }
  const [moment, setMoment] = useState<WaveMoment>(() => waveMoment(plan, 0))
  const shown = useRef(moment)
  const finish = useRef(onFinish)
  useEffect(() => {
    finish.current = onFinish
  })
  useWakeLock(true)

  // The open set is often half below the fold or under the add button: bring the wave into view.
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // In braces: newer browsers return a promise from scrollIntoView, which is no cleanup function.
    panel.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  // Wall-clock time, so the wave stays right when frames are dropped or the app was in the background.
  useAnimationFrame(() => {
    const elapsed = Date.now() - start.current
    seconds.set(elapsed / 1000 - COUNTDOWN_SECONDS)
    const next = waveMoment(plan, elapsed)
    if (sameMoment(next, shown.current)) return
    signal(next, shown.current)
    shown.current = next
    setMoment(next)
    if (next.phase === 'done') finish.current()
  })

  const counting = moment.phase === 'countdown'
  const rep = moment.phase === 'lift' || moment.phase === 'lower' ? moment.rep : plan.reps
  const anchorSeconds = counting ? -COUNTDOWN_SECONDS : (rep - 1) * repSeconds(plan.tempo)

  return (
    <div ref={panel} className="knurl my-2 rounded-xl border border-line p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold">{t.tracker.set(number)}</span>
        <span className="text-[13px] font-medium text-muted">{tempoText(plan, t.tracker)}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <p role="timer" aria-label={counting ? t.tracker.startsIn : t.tracker.repOf(rep, plan.reps)} className="numeral text-[49px] leading-none">
          {counting ? (
            moment.secondsLeft
          ) : (
            <>
              {rep}
              <span className="ml-1.5 text-[25px] text-muted">/ {plan.reps}</span>
            </>
          )}
        </p>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold">
            {counting ? t.tracker.getReady : moment.phase === 'lift' ? t.tracker.phaseLift : moment.phase === 'lower' ? t.tracker.phaseLower : t.tracker.phaseDone}
          </p>
          {/* Breathing follows the effort: out while lifting, in while lowering. */}
          <p className="text-[14px] font-medium text-muted">
            {moment.phase === 'lift' ? t.tracker.breatheOut : moment.phase === 'lower' ? t.tracker.breatheIn : counting ? t.tracker.breatheCalmly : ' '}
          </p>
        </div>
        {/* In the starting position during the countdown, then one repetition after the other. */}
        {exercise && <FigureFrame exercise={exercise} plan={plan} seconds={seconds} className="ml-auto size-24" />}
      </div>
      <div className="mt-2">
        <WaveTrack plan={plan} seconds={seconds} anchorSeconds={anchorSeconds} />
      </div>
      <div className="mt-3 flex gap-2">
        {counting && (
          <m.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={snap}
            onClick={skipCountdown}
            className="flex flex-[3] items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-accent-ink transition hover:brightness-105"
          >
            <Play className="size-4" strokeWidth={2.75} />
            {t.tracker.startNow}
          </m.button>
        )}
        <m.button
          type="button"
          whileTap={{ scale: 0.97 }}
          transition={snap}
          onClick={() => {
            haptic()
            onStop(completedReps(plan, Date.now() - start.current))
          }}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-sunken py-3.5 text-[15px] font-semibold transition-colors hover:bg-fg hover:text-bg"
        >
          <Square className="size-4" strokeWidth={2.75} />
          {counting ? t.common.cancel : t.tracker.endEarly}
        </m.button>
      </div>
    </div>
  )
}
