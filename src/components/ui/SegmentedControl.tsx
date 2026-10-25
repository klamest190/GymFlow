import { m } from 'framer-motion'
import { useId } from 'react'
import { snap } from '../../lib/motion'

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
  size?: 'sm' | 'md'
}

/** iOS-style segmented control with a sliding selection pill. */
export function SegmentedControl<T extends string>({ value, onChange, options, label, size = 'md' }: SegmentedControlProps<T>) {
  // Unique per instance so several controls on one screen don't share the animated pill.
  const layoutId = useId()
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-sunken p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`relative flex-1 whitespace-nowrap rounded-lg font-semibold transition-colors ${
              size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]'
            } ${active ? 'text-fg' : 'text-muted hover:text-fg'}`}
          >
            {active && (
              <m.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-surface-solid shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
                transition={snap}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
