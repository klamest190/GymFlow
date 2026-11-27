import { useSyncExternalStore } from 'react'

/**
 * The app language. Like the theme it is a per-device setting in localStorage; without one the
 * browser's language decides (German for German, English for everything else).
 */
export const LOCALES = ['de', 'en'] as const
export type Locale = (typeof LOCALES)[number]

const LOCALE_KEY = 'gymflow:locale'

const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale)

/** Outside a browser (unit tests) the app speaks German, the language it was written in. */
function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'de'
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const language of languages) {
    const base = language?.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return 'en'
}

let locale: Locale = detectLocale()
const listeners = new Set<() => void>()

/** The page description and install manifest, which live outside React, follow the language too. */
const HEAD: Record<Locale, { description: string; manifest: string }> = {
  de: { description: 'GymFlow – Workouts tracken, Fortschritt sehen.', manifest: '/manifest.webmanifest' },
  en: { description: 'GymFlow – track workouts, see your progress.', manifest: '/manifest.en.webmanifest' },
}

function applyLocale() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  document.querySelector('meta[name="description"]')?.setAttribute('content', HEAD[locale].description)
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', HEAD[locale].manifest)
}
applyLocale()

export const getLocale = () => locale

export function setLocale(next: Locale) {
  if (next === locale) return
  locale = next
  try {
    localStorage.setItem(LOCALE_KEY, next)
  } catch {
    // Ignore: the language just won't persist.
  }
  applyLocale()
  listeners.forEach((listener) => listener())
}

/** Calls `onChange` after every language switch; returns the unsubscribe function. */
export const onLocaleChange = (onChange: () => void) => {
  listeners.add(onChange)
  return () => void listeners.delete(onChange)
}

/** The current language; the calling component re-renders when it changes. */
export const useLocale = () => useSyncExternalStore(onLocaleChange, getLocale, getLocale)

/** BCP 47 tag for `Intl`: British English for 24-hour times, day-month order and Monday weeks. */
export const intlLocale = (value: Locale = locale) => (value === 'de' ? 'de-DE' : 'en-GB')
