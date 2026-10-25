import { useTheme } from '../../hooks/useUi'

/**
 * SVG chart colors per theme. Recharts writes colors into presentation attributes, where CSS
 * variables aren't reliable, so the values are resolved here instead of in index.css.
 *
 * Validated with the dataviz palette checker against the card surfaces (#f6f7f5 / #23282b):
 * the light accent is a darker mustard step of the plate yellow, because #f2c200 on a light
 * surface falls below the 3:1 contrast minimum for data marks.
 */
const LIGHT = {
  accent: '#b08900',
  /** Lighter step of the same ramp: the in-progress current week. */
  accentSoft: '#e6cf7a',
  areaOpacity: 0.14,
  surface: '#f6f7f5',
  grid: '#dcdfdb',
  axis: '#7a8187',
  cursor: 'rgba(28, 31, 34, 0.08)',
  /** Sequential ramp for the heatmap, level 0 (no training) → 4. */
  heat: ['rgba(28, 31, 34, 0.08)', '#f3e3a0', '#e2c04a', '#b08900', '#6e5500'],
}

const DARK: typeof LIGHT = {
  accent: '#f2c200',
  accentSoft: '#6a5a1c',
  areaOpacity: 0.1,
  surface: '#23282b',
  grid: '#343a3e',
  axis: '#8b9399',
  cursor: 'rgba(255, 255, 255, 0.06)',
  heat: ['rgba(255, 255, 255, 0.07)', '#4a3e12', '#7a6414', '#b89300', '#f2c200'],
}

export type ChartTheme = typeof LIGHT

export function useChartTheme(): ChartTheme {
  return useTheme().isDark ? DARK : LIGHT
}
