import { m, useAnimationFrame, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { Play, Square } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { haptic } from '../../hooks/useUi'
import { useWakeLock } from '../../hooks/useWakeLock'
import { snap } from '../../lib/motion'
import { playCountdownTick, playWaveDone, playWaveStart, playWaveTurn, unlockAudio } from '../../lib/sound'
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

const tempoText = (plan: WavePlan) => {
  const lift = `${plan.tempo.liftSeconds} s heben`
  const lower = `${plan.tempo.lowerSeconds} s senken`
  return plan.lowersFirst ? `${lower}, ${lift}` : `${lift}, ${lower}`
}

/** The wave of the open set, standing still, with the button that starts it. */
export function WavePreview({ plan, onStart }: { plan: WavePlan; onStart: () => void }) {
  const seconds = useMotionValue(0)
  return (
    <div className="mt-3 border-t border-line pt-2">
      <WaveTrack plan={plan} seconds={seconds} anchorSeconds={0} />
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] font-medium text-muted">{tempoText(plan)}</p>
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
          Welle starten
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
 * The running wave: counts down from 5, then leads through every repetition. `onFinish` after
 * the last one; `onStop` with the repetitions done so far when it is ended early.
 */
export function WaveRun({
  plan,
  number,
  startedAt,
  onFinish,
  onStop,
}: {
  plan: WavePlan
  number: number
  /** `Date.now()` of the tap on "Welle starten". */
  startedAt: number
  onFinish: () => void
  onStop: (completedReps: number) => void
}) {
  const seconds = useMotionValue(-COUNTDOWN_SECONDS)
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
    const elapsed = Date.now() - startedAt
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
        <span className="text-[13px] font-semibold">Satz {number}</span>
        <span className="text-[13px] font-medium text-muted">{tempoText(plan)}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <p role="timer" aria-label={counting ? 'Start in Sekunden' : `Wiederholung ${rep} von ${plan.reps}`} className="numeral text-[49px] leading-none">
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
            {counting ? 'Position einnehmen' : moment.phase === 'lift' ? 'Heben' : moment.phase === 'lower' ? 'Senken' : 'Geschafft'}
          </p>
          {/* Breathing follows the effort: out while lifting, in while lowering. */}
          <p className="text-[14px] font-medium text-muted">
            {moment.phase === 'lift' ? 'Ausatmen' : moment.phase === 'lower' ? 'Einatmen' : counting ? 'Ruhig atmen' : ' '}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <WaveTrack plan={plan} seconds={seconds} anchorSeconds={anchorSeconds} />
      </div>
      <m.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={snap}
        onClick={() => {
          haptic()
          onStop(completedReps(plan, Date.now() - startedAt))
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sunken py-3.5 text-[15px] font-semibold transition-colors hover:bg-fg hover:text-bg"
      >
        <Square className="size-4" strokeWidth={2.75} />
        {counting ? 'Abbrechen' : 'Vorzeitig beenden'}
      </m.button>
    </div>
  )
}
