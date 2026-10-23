import { motion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'

export interface FilterOption<T extends string> {
  value: T
  label: string
  /** Tailwind background class for a small color dot in front of the label. */
  dot?: string
}

interface FilterPillsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: FilterOption<T>[]
  label: string
  className?: string
}

/**
 * Horizontally scrolling single-choice pills. The neon highlight slides between pills and the
 * active pill is scrolled into view, so it never hides off-screen on phones.
 */
export function FilterPills<T extends string>({ value, onChange, options, label, className = '' }: FilterPillsProps<T>) {
  const layoutId = useId()
  const activeRef = useRef<HTMLButtonElement>(null)
  const shownValue = useRef(value)

  useEffect(() => {
    // Only follow actual changes; scrolling on mount could move the page.
    if (shownValue.current === value) return
    shownValue.current = value
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [value])

  return (
    <div role="radiogroup" aria-label={label} className={`no-scrollbar flex gap-2 overflow-x-auto scroll-smooth ${className}`}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <motion.button
            key={option.value}
            ref={active ? activeRef : undefined}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.94 }}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              active ? 'text-accent-ink' : 'bg-sunken text-muted hover:text-fg'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-accent shadow-accent"
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
              />
            )}
            {option.dot && (
              <span className={`relative size-2 rounded-full ${option.dot} ${active ? 'ring-2 ring-accent-ink/25' : ''}`} />
            )}
            <span className="relative whitespace-nowrap">{option.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
