import { AnimatePresence, m } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface SelectOption<T extends string> {
  value: T
  label: string
  /** Secondary line under the label, e.g. a count. */
  hint?: string
  /** Element in front of the label, e.g. a color dot. */
  leading?: ReactNode
}

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  label: string
  className?: string
}

/**
 * Glass dropdown (ARIA listbox). Native selects can't be styled on desktop, so this renders its
 * own popover with full keyboard support: arrows, Home/End, Enter/Space, Escape and Tab.
 */
export function Select<T extends string>({ value, onChange, options, label, className = '' }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value) ?? options[0]

  const openList = () => {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) trigger.current?.focus()
  }

  const choose = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    close()
  }

  // Close on any pointer press outside the component.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Keep the highlighted option visible while navigating long lists.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, listId])

  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }
    const last = options.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, activeIndex + 1),
      ArrowUp: Math.max(0, activeIndex - 1),
      Home: 0,
      End: last,
    }
    if (event.key in moves) {
      event.preventDefault()
      setActiveIndex(moves[event.key])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(activeIndex)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center gap-2 rounded-2xl bg-sunken px-3.5 py-2.5 text-left text-[14px] font-semibold transition-shadow ${
          open ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-line'
        }`}
      >
        {selected?.leading}
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
          <ChevronDown className="size-4 text-muted" strokeWidth={2.5} />
        </m.span>
      </button>

      <AnimatePresence>
        {open && (
          <m.ul
            id={listId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            className="absolute right-0 top-full z-40 mt-2 max-h-72 w-full min-w-56 origin-top overflow-y-auto rounded-2xl border border-line bg-surface-solid p-1.5 shadow-float"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  // Keep focus on the trigger so keyboard handling stays in one place.
                  onPointerDown={(event) => event.preventDefault()}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] transition-colors ${
                    index === activeIndex ? 'bg-sunken' : ''
                  }`}
                >
                  {option.leading}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-medium'}`}>{option.label}</span>
                    {option.hint && <span className="block text-[12px] text-muted">{option.hint}</span>}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-accent-fg" strokeWidth={3} />}
                </li>
              )
            })}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
