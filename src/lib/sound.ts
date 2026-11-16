/**
 * The rest timer's end signal and the training wave's cues, synthesized with Web Audio (no audio
 * file to load or cache). iOS only lets a page play sound after a tap, so `unlockAudio` runs inside
 * the tap that starts the rest or the wave; the signals themselves play later.
 */

// Safari 17+: 'transient' marks short notification sounds that play over (and duck) music
// instead of stopping it. Not in TypeScript's DOM types yet.
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

let context: AudioContext | null = null

export function unlockAudio() {
  try {
    const { audioSession } = navigator as AudioSessionNavigator
    if (audioSession) audioSession.type = 'transient'
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
  } catch {
    // No Web Audio: the timer still shows the end, just silently.
  }
}

/** One short sine beep, `delay` seconds from now. */
function beep(frequency: number, delay = 0, volume = 0.5) {
  if (!context || context.state !== 'running') return
  const at = context.currentTime + 0.05 + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  // Short attack and decay, so the beep doesn't click.
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(volume, at + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(at)
  oscillator.stop(at + 0.2)
}

/** Three short beeps, the last one higher. */
export function playRestOver() {
  ;[880, 880, 1320].forEach((frequency, index) => beep(frequency, index * 0.28))
}

/** The last seconds before the training wave starts. */
export const playCountdownTick = () => beep(660)

/** The wave starts: go. */
export const playWaveStart = () => beep(1320)

/** A turning point of the wave, audible without looking: high means lift, low means lower. */
export const playWaveTurn = (lift: boolean) => beep(lift ? 880 : 520, 0, 0.3)

/** The last repetition is done. */
export function playWaveDone() {
  beep(1320)
  beep(1760, 0.2)
}
