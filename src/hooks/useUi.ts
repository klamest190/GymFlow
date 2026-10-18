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

const THEME_KEY = 'gymflow:theme'

const subscribeToTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
const readIsDark = () => document.documentElement.classList.contains('dark')

/** Theme state derived from the `.dark` class on <html>, so every toggle instance stays in sync. */
export function useTheme() {
  const isDark = useSyncExternalStore(subscribeToTheme, readIsDark)

  const toggle = useCallback(() => {
    const next = !readIsDark()
    document.documentElement.classList.toggle('dark', next)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#0a0a0b' : '#f2f2f7')
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch {
      // Ignore: the theme just won't persist.
    }
  }, [])

  return { isDark, toggle }
}

/** Light haptic tick on devices that support it (Android); a no-op elsewhere. */
export const haptic = (ms = 8) => navigator.vibrate?.(ms)
