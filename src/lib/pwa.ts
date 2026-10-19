import { useSyncExternalStore } from 'react'

/** Chromium's install prompt event (not in the TS DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

/** Call once at startup: captures the install prompt and registers the service worker (production only). */
export function initPwa() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
  // In dev the service worker would cache Vite's unbundled modules and fight HMR.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => console.error('[GymFlow] service worker', error))
    })
  }
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export type InstallState =
  | { kind: 'installed' }
  | { kind: 'prompt'; install: () => Promise<void> }
  /** iOS Safari has no install prompt; users add the app via the share sheet. */
  | { kind: 'ios' }
  | { kind: 'unavailable' }

function readInstallState(): InstallState {
  if (isStandalone()) return { kind: 'installed' }
  if (deferredPrompt) {
    const prompt = deferredPrompt
    return {
      kind: 'prompt',
      install: async () => {
        await prompt.prompt()
        await prompt.userChoice
        deferredPrompt = null
        notify()
      },
    }
  }
  return isIos() ? { kind: 'ios' } : { kind: 'unavailable' }
}

// Cache the snapshot so useSyncExternalStore sees a stable value between notifications.
let snapshot = readInstallState()
listeners.add(() => {
  snapshot = readInstallState()
})

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => void listeners.delete(onChange)
    },
    () => snapshot,
  )
}
