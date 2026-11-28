/**
 * The training wave: a curve that sets the pace of a set. A dot rides it up while the weight is
 * lifted and down while it is lowered; after a countdown it runs once per repetition.
 */
export interface Tempo {
  liftSeconds: number
  lowerSeconds: number
}

export const DEFAULT_TEMPO: Tempo = { liftSeconds: 2, lowerSeconds: 3 }
export const MIN_TEMPO_SECONDS = 1
/** Slower than this per phase and a repetition gets into the very slow range that builds less muscle. */
export const MAX_TEMPO_SECONDS = 6
/**
 * Time to put the phone down, pick up the dumbbells and get into position between "Welle starten"
 * and the first repetition. Whoever is ready sooner starts at once with "Jetzt starten".
 */
export const COUNTDOWN_SECONDS = 10

export interface WavePlan {
  tempo: Tempo
  reps: number
  /** The movement starts at the top (bench press, squats): the wave goes down first. */
  lowersFirst: boolean
}

export type WaveMoment =
  | { phase: 'countdown'; secondsLeft: number }
  | { phase: 'lift' | 'lower'; rep: number }
  | { phase: 'done' }

export function clampTempoSeconds(seconds: number, fallback: number): number {
  if (!Number.isFinite(seconds)) return fallback
  return Math.min(MAX_TEMPO_SECONDS, Math.max(MIN_TEMPO_SECONDS, Math.round(seconds)))
}

export function parseTempo(stored: string | null): Tempo {
  if (!stored) return DEFAULT_TEMPO
  try {
    const value = JSON.parse(stored) as Partial<Tempo> | null
    return {
      liftSeconds: clampTempoSeconds(Number(value?.liftSeconds), DEFAULT_TEMPO.liftSeconds),
      lowerSeconds: clampTempoSeconds(Number(value?.lowerSeconds), DEFAULT_TEMPO.lowerSeconds),
    }
  } catch {
    return DEFAULT_TEMPO
  }
}

export const repSeconds = (tempo: Tempo) => tempo.liftSeconds + tempo.lowerSeconds

/** Duration of all repetitions, without the countdown. */
export const waveSeconds = (plan: WavePlan) => plan.reps * repSeconds(plan.tempo)

/** Slow at the turning points, fastest in between, like a controlled repetition. */
const ease = (progress: number) => (1 - Math.cos(Math.PI * progress)) / 2

/**
 * Position of the weight, 0 (bottom) to 1 (top), `seconds` after the first repetition started.
 * Before and after the set it rests in the starting position.
 */
export function waveHeight(plan: WavePlan, seconds: number): number {
  const start = plan.lowersFirst ? 1 : 0
  if (seconds <= 0 || seconds >= waveSeconds(plan)) return start
  const period = repSeconds(plan.tempo)
  const firstHalf = plan.lowersFirst ? plan.tempo.lowerSeconds : plan.tempo.liftSeconds
  const inRep = seconds % period
  // Distance from the starting position: out during the first half, back during the second.
  const away = inRep < firstHalf ? ease(inRep / firstHalf) : 1 - ease((inRep - firstHalf) / (period - firstHalf))
  return plan.lowersFirst ? 1 - away : away
}

/** What is happening `elapsedMs` after "Welle starten" (the countdown comes first). */
export function waveMoment(plan: WavePlan, elapsedMs: number): WaveMoment {
  const seconds = elapsedMs / 1000 - COUNTDOWN_SECONDS
  if (seconds < 0) return { phase: 'countdown', secondsLeft: Math.ceil(-seconds) }
  if (seconds >= waveSeconds(plan)) return { phase: 'done' }
  const period = repSeconds(plan.tempo)
  const firstHalf = plan.lowersFirst ? plan.tempo.lowerSeconds : plan.tempo.liftSeconds
  const inFirstHalf = seconds % period < firstHalf
  return { phase: inFirstHalf === plan.lowersFirst ? 'lower' : 'lift', rep: Math.floor(seconds / period) + 1 }
}

/** Repetitions finished `elapsedMs` after "Welle starten". */
export function completedReps(plan: WavePlan, elapsedMs: number): number {
  const seconds = elapsedMs / 1000 - COUNTDOWN_SECONDS
  return Math.min(plan.reps, Math.max(0, Math.floor(seconds / repSeconds(plan.tempo))))
}

export interface WaveGeometry {
  pxPerSecond: number
  /** y of the top and bottom position. */
  top: number
  bottom: number
}

export const waveY = (geometry: WaveGeometry, height: number) => geometry.bottom - height * (geometry.bottom - geometry.top)

/** SVG path of the wave between two moments; x is the time in seconds times `pxPerSecond`. */
export function wavePath(plan: WavePlan, geometry: WaveGeometry, fromSeconds: number, toSeconds: number): string {
  const step = 1 / 15
  const points: string[] = []
  for (let seconds = fromSeconds; seconds < toSeconds + step; seconds += step) {
    const x = (seconds * geometry.pxPerSecond).toFixed(1)
    const y = waveY(geometry, waveHeight(plan, seconds)).toFixed(1)
    points.push(`${points.length === 0 ? 'M' : 'L'}${x} ${y}`)
  }
  return points.join('')
}
