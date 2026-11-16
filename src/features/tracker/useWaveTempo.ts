import { useSyncExternalStore } from 'react'
import { parseTempo, type Tempo } from '../../lib/tempoWave'

const TEMPO_KEY = 'gymflow:waveTempo'

function readStored(): string | null {
  try {
    return localStorage.getItem(TEMPO_KEY)
  } catch {
    return null
  }
}

let tempo = parseTempo(readStored())
const listeners = new Set<() => void>()

function setTempo(next: Tempo) {
  // Through the parser, so the stored and the used values are always within the limits.
  tempo = parseTempo(JSON.stringify(next))
  try {
    localStorage.setItem(TEMPO_KEY, JSON.stringify(tempo))
  } catch {
    // Storage blocked: the tempo holds until the app closes.
  }
  listeners.forEach((listener) => listener())
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange)
  return () => void listeners.delete(onChange)
}

/** Pace of the training wave; stored per device like the rest time. */
export function useWaveTempo() {
  return [useSyncExternalStore(subscribe, () => tempo), setTempo] as const
}
