import { motion, useAnimate } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { haptic } from '../../hooks/useUi'

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
}

const format = (value: number | null) => (value === null ? '' : String(value).replace('.', ','))

/** Compact −/+ stepper with an editable center value (tap to type, commits on blur/Enter). */
export function NumberStepper({ value, onChange, step, min = 0, max = 9999, nullable, placeholder = '0', label }: NumberStepperProps) {
  const [scope, animate] = useAnimate<HTMLInputElement>()
  // Free text only while the field is being edited; otherwise always mirror `value`.
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? format(value)

  const clamp = (next: number) => Math.min(max, Math.max(min, Math.round(next * 100) / 100))

  const nudge = (direction: 1 | -1) => {
    const base = value ?? (direction === 1 ? 0 : min)
    const next = clamp(base + direction * step)
    if (nullable && direction === -1 && value !== null && value <= min) onChange(null)
    else if (next !== value) onChange(next)
    haptic()
    void animate(scope.current, { scale: [1, 1.18, 1] }, { duration: 0.28, ease: 'easeOut' })
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

  const buttonClass =
    'grid size-8 shrink-0 place-items-center rounded-full bg-sunken text-fg/80 transition-colors hover:bg-accent hover:text-accent-ink disabled:opacity-30 disabled:hover:bg-sunken disabled:hover:text-fg/80'

  return (
    <div className="flex min-w-0 items-center gap-1" role="group" aria-label={label}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.82 }}
        className={buttonClass}
        onClick={() => nudge(-1)}
        disabled={value === null || (!nullable && value <= min)}
        aria-label={`${label} verringern`}
      >
        <Minus className="size-3.5" strokeWidth={3} />
      </motion.button>
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
        className="w-11 min-w-0 rounded-lg bg-transparent py-1 text-center text-[17px] font-semibold tabular-nums tracking-tight outline-none placeholder:text-muted/60 focus:bg-sunken"
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.82 }}
        className={buttonClass}
        onClick={() => nudge(1)}
        disabled={value !== null && value >= max}
        aria-label={`${label} erhöhen`}
      >
        <Plus className="size-3.5" strokeWidth={3} />
      </motion.button>
    </div>
  )
}
