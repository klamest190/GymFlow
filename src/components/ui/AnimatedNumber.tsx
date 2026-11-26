import { m, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { formatNumber } from '../../i18n/format'
import { useLocale, type Locale } from '../../i18n/locale'

/** `12.450` → `12,5k` once a value no longer fits a small stat tile. */
const formatCompact = (value: number, locale: Locale) =>
  value >= 10_000 ? `${formatNumber(value / 1000, 1, locale)}k` : formatNumber(value, 0, locale)

/** Number that springs to its new value instead of jumping. */
export function AnimatedNumber({ value, compact, className }: { value: number; compact?: boolean; className?: string }) {
  const locale = useLocale()
  const spring = useSpring(value, { stiffness: 120, damping: 20, mass: 0.6 })
  // Re-evaluated on every render, so a language switch reformats the current value right away.
  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current)
    return compact ? formatCompact(rounded, locale) : formatNumber(rounded, 0, locale)
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <m.span className={className}>{display}</m.span>
}
