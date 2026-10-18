import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

const formatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
const compactFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

/** `12.450` → `12,5k` once a value no longer fits a small stat tile. */
const formatCompact = (value: number) =>
  value >= 10_000 ? `${compactFormatter.format(value / 1000)}k` : formatter.format(value)

/** Number that springs to its new value instead of jumping. */
export function AnimatedNumber({ value, compact, className }: { value: number; compact?: boolean; className?: string }) {
  const spring = useSpring(value, { stiffness: 120, damping: 20, mass: 0.6 })
  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current)
    return compact ? formatCompact(rounded) : formatter.format(rounded)
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{display}</motion.span>
}
