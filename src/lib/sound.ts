/**
 * The rest timer's end signal, synthesized with Web Audio (no audio file to load or cache).
 * iOS only lets a page play sound after a tap, so `unlockAudio` runs inside the tap that starts
 * the rest; the signal itself plays later from the timer.
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

/** Three short beeps, the last one higher. */
export function playRestOver() {
  if (!context || context.state !== 'running') return
  const start = context.currentTime + 0.05
  ;[880, 880, 1320].forEach((frequency, index) => {
    const at = start + index * 0.28
    const oscillator = context!.createOscillator()
    const gain = context!.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    // Short attack and decay, so the beep doesn't click.
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.5, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18)
    oscillator.connect(gain).connect(context!.destination)
    oscillator.start(at)
    oscillator.stop(at + 0.2)
  })
}
