import { useTheme } from '../../hooks/useUi'

/**
 * SVG chart colors per theme. Recharts writes colors into presentation attributes, where CSS
 * variables aren't reliable, so the values are resolved here instead of in index.css.
 *
 * Validated with the dataviz palette checker against the card surfaces (#fafafc / #141416):
 * the light accent is a darker step of the brand green, because neon lime on white falls below
 * the 3:1 contrast minimum for data marks.
 */
const LIGHT = {
  accent: '#4f8a00',
  /** Lighter step of the same ramp: the in-progress current week. */
  accentSoft: '#bfe08f',
  areaOpacity: 0.12,
  surface: '#fafafc',
  grid: '#e5e5ea',
  axis: '#8e8e93',
  cursor: 'rgba(118, 118, 128, 0.12)',
  /** Sequential ramp for the heatmap, level 0 (no training) → 4. */
  heat: ['rgba(118, 118, 128, 0.14)', '#d8f2ae', '#a5d65c', '#6aa51c', '#3f7400'],
}

const DARK: typeof LIGHT = {
  accent: '#c6ff3d',
  accentSoft: '#53682a',
  areaOpacity: 0.1,
  surface: '#141416',
  grid: '#2a2a2e',
  axis: '#8e8e93',
  cursor: 'rgba(255, 255, 255, 0.06)',
  heat: ['rgba(118, 118, 128, 0.22)', '#2f4313', '#4f7218', '#86bd22', '#c6ff3d'],
}

export type ChartTheme = typeof LIGHT

export function useChartTheme(): ChartTheme {
  return useTheme().isDark ? DARK : LIGHT
}
