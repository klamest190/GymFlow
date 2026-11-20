import { m } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import { snap } from '../../lib/motion'

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
 * Horizontally scrolling single-choice pills (a `scroll-row`: set `--row-inset` in `className` to
 * the surrounding card's padding). The highlight slides between pills and the active pill is
 * scrolled fully into view with the row's inset beside it, so it never hides at the edge on phones.
 */
export function FilterPills<T extends string>({ value, onChange, options, label, className = '' }: FilterPillsProps<T>) {
  const layoutId = useId()
  const rowRef = useRef<HTMLDivElement>(null)
  const shownValue = useRef(value)

  useEffect(() => {
    // Only follow actual changes; scrolling on mount could move the page.
    if (shownValue.current === value) return
    shownValue.current = value
    const row = rowRef.current
    // Looked up, not a ref passed to the active pill: motion components keep the first ref they
    // get, so a ref moving from pill to pill would still point at the previously active one.
    const pill = row?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (!row || !pill) return
    // Scrolls only the row (scrollIntoView would also move the page and, on iOS, stop short).
    const inset = parseFloat(getComputedStyle(row).paddingLeft) || 0
    const start = pill.offsetLeft - inset
    const end = pill.offsetLeft + pill.offsetWidth + inset - row.clientWidth
    if (row.scrollLeft > start) row.scrollTo({ left: start, behavior: 'smooth' })
    else if (row.scrollLeft < end) row.scrollTo({ left: end, behavior: 'smooth' })
  }, [value])

  return (
    <div ref={rowRef} role="radiogroup" aria-label={label} className={`no-scrollbar scroll-row scroll-smooth ${className}`}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <m.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.94 }}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              active ? 'text-bg' : 'bg-sunken text-muted hover:text-fg'
            }`}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-fg"
                transition={snap}
              />
            )}
            {option.dot && (
              <span className={`relative size-2 rounded-full ${option.dot} ${active ? 'ring-2 ring-bg/40' : ''}`} />
            )}
            <span className="relative whitespace-nowrap">{option.label}</span>
          </m.button>
        )
      })}
    </div>
  )
}
