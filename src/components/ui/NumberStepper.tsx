import { m, useAnimate } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { haptic } from '../../hooks/useUi'
import { easeOut, snap } from '../../lib/motion'

interface NumberStepperProps {
  value: number | null
  onChange: (value: number | null) => void
  step: number
  min?: number
  max?: number
  /** Allows clearing the field to `null` (e.g. bodyweight instead of a weight). */
  nullable?: boolean
  placeholder?: string
  label: string
  /** `lg`: 44px graphite keys and a stamped numeral, for the active set in the tracker. */
  size?: 'md' | 'lg'
}

const format = (value: number | null) => (value === null ? '' : String(value).replace('.', ','))

const SIZES = {
  md: {
    button:
      'size-8 rounded-full bg-sunken text-fg/80 hover:bg-fg hover:text-bg disabled:hover:bg-sunken disabled:hover:text-fg/80',
    icon: 'size-3.5',
    input: 'w-11 rounded-lg py-1 text-[17px] font-semibold tabular-nums tracking-tight',
  },
  lg: {
    button: 'size-11 rounded-xl bg-fg text-bg hover:bg-fg/85 disabled:hover:bg-fg',
    icon: 'size-4.5',
    input: 'numeral w-14 rounded-lg py-0.5 text-[31px] leading-none',
  },
}

/** −/+ stepper with an editable center value (tap to type, commits on blur/Enter). */
export function NumberStepper({ value, onChange, step, min = 0, max = 9999, nullable, placeholder = '0', label, size = 'md' }: NumberStepperProps) {
  const [scope, animate] = useAnimate<HTMLInputElement>()
  // Free text only while the field is being edited; otherwise always mirror `value`.
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? format(value)
  const styles = SIZES[size]

  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next * 100) / 100))

  const nudge = (direction: 1 | -1) => {
    const base = value ?? (direction === 1 ? 0 : min)
    const next = clamp(base + direction * step)
    if (nullable && direction === -1 && value !== null && value <= min) onChange(null)
    else if (next !== value) onChange(next)
    haptic()
    // A short nudge in the direction of the change: up for +, down for −.
    void animate(scope.current, { y: [0, direction * -3, 0] }, { duration: 0.2, ease: easeOut })
  }

  const commit = () => {
    setDraft(null)
    const trimmed = text.trim()
    if (trimmed === '') {
      onChange(nullable ? null : min)
      return
    }
    const parsed = Number.parseFloat(trimmed.replace(',', '.'))
    if (Number.isFinite(parsed)) onChange(clamp(parsed))
  }

  const buttonClass = `grid shrink-0 place-items-center transition-colors disabled:opacity-30 ${styles.button}`

  return (
    <div className="flex min-w-0 items-center gap-1" role="group" aria-label={label}>
      <m.button
        type="button"
        whileTap={{ scale: 0.88 }}
        transition={snap}
        className={buttonClass}
        onClick={() => nudge(-1)}
        disabled={value === null || (!nullable && value <= min)}
        aria-label={`${label} verringern`}
      >
        <Minus className={styles.icon} strokeWidth={3} />
      </m.button>
      <input
        ref={scope}
        value={text}
        placeholder={placeholder}
        inputMode="decimal"
        aria-label={label}
        onFocus={(event) => {
          setDraft(format(value))
          event.target.select()
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
        className={`min-w-0 bg-transparent text-center outline-none placeholder:text-muted/60 focus:bg-sunken ${styles.input}`}
      />
      <m.button
        type="button"
        whileTap={{ scale: 0.88 }}
        transition={snap}
        className={buttonClass}
        onClick={() => nudge(1)}
        disabled={value !== null && value >= max}
        aria-label={`${label} erhöhen`}
      >
        <Plus className={styles.icon} strokeWidth={3} />
      </m.button>
    </div>
  )
}
