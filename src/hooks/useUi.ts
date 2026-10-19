import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
export const useIsTouch = () => useMediaQuery('(pointer: coarse)')

// ─── Theme ───────────────────────────────────────────────────────────────────
// The preference lives in localStorage (per device) and is applied before first paint by the
// inline script in index.html. 'system' follows the OS setting live.

export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_KEY = 'gymflow:theme'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

let themePreference = readStoredPreference()
const preferenceListeners = new Set<() => void>()

function applyTheme() {
  const dark = themePreference === 'system' ? darkQuery.matches : themePreference === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0a0b' : '#f2f2f7')
}

darkQuery.addEventListener('change', () => themePreference === 'system' && applyTheme())

function setThemePreference(next: ThemePreference) {
  themePreference = next
  try {
    if (next === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, next)
  } catch {
    // Ignore: the theme just won't persist.
  }
  applyTheme()
  preferenceListeners.forEach((listener) => listener())
}

const subscribeToPreference = (onChange: () => void) => {
  preferenceListeners.add(onChange)
  return () => void preferenceListeners.delete(onChange)
}

const subscribeToDarkClass = (onChange: () => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
const readIsDark = () => document.documentElement.classList.contains('dark')

/** Theme state shared by every caller: the resolved `isDark` plus the stored preference. */
export function useTheme() {
  const isDark = useSyncExternalStore(subscribeToDarkClass, readIsDark)
  const preference = useSyncExternalStore(subscribeToPreference, () => themePreference)
  const toggle = useCallback(() => setThemePreference(readIsDark() ? 'light' : 'dark'), [])
  return { isDark, preference, setPreference: setThemePreference, toggle }
}

/** Light haptic tick on devices that support it (Android); a no-op elsewhere. */
export const haptic = (ms = 8) => navigator.vibrate?.(ms)
