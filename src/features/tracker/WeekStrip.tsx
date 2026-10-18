import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { addDays, dayOfMonth, formatMonth, formatWeekday, todayKey, weekDays } from '../../lib/dates'
import type { DateKey } from '../../types/models'

interface WeekStripProps {
  selected: DateKey
  onSelect: (date: DateKey) => void
  /** Dates in the visible week that already have a workout. */
  activeDates: Set<DateKey>
}

const SWIPE_THRESHOLD = 60

/** Seven-day picker. Swipe horizontally (or use the chevrons) to move between weeks. */
export function WeekStrip({ selected, onSelect, activeDates }: WeekStripProps) {
  const [direction, setDirection] = useState<1 | -1>(1)
  const today = todayKey()
  const days = weekDays(selected)
  const isCurrentWeek = days.includes(today)

  const shiftWeek = (delta: 1 | -1) => {
    if (delta === 1 && isCurrentWeek) return
    setDirection(delta)
    const target = addDays(selected, delta * 7)
    onSelect(target > today ? today : target)
  }

  return (
    <section className="glass rounded-3xl p-3 sm:p-4" aria-label="Woche auswählen">
      <div className="mb-2 flex items-center justify-between px-1.5">
        <span className="text-[15px] font-semibold capitalize tracking-tight">{formatMonth(days[0])}</span>
        <div className="flex gap-1">
          <ChevronButton label="Vorherige Woche" onClick={() => shiftWeek(-1)}>
            <ChevronLeft className="size-4.5" strokeWidth={2.5} />
          </ChevronButton>
          <ChevronButton label="Nächste Woche" onClick={() => shiftWeek(1)} disabled={isCurrentWeek}>
            <ChevronRight className="size-4.5" strokeWidth={2.5} />
          </ChevronButton>
        </div>
      </div>

      <motion.div
        className="relative touch-pan-y overflow-hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragDirectionLock
        onDragEnd={(_, info) => {
          if (info.offset.x < -SWIPE_THRESHOLD) shiftWeek(1)
          else if (info.offset.x > SWIPE_THRESHOLD) shiftWeek(-1)
        }}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={days[0]}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map((day) => {
              const isSelected = day === selected
              const isToday = day === today
              const isFuture = day > today
              const hasWorkout = activeDates.has(day)
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => onSelect(day)}
                  className="relative flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-opacity disabled:opacity-30"
                  aria-pressed={isSelected}
                  aria-label={day}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="week-selected"
                      className="absolute inset-0 rounded-2xl bg-accent shadow-accent"
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                    />
                  )}
                  <span
                    className={`relative text-[11px] font-semibold uppercase tracking-wider ${
                      isSelected ? 'text-accent-ink/70' : 'text-muted'
                    }`}
                  >
                    {formatWeekday(day)}
                  </span>
                  <span
                    className={`relative text-[19px] font-semibold tabular-nums leading-none tracking-tight ${
                      isSelected ? 'text-accent-ink' : isToday ? 'text-accent-fg' : ''
                    }`}
                  >
                    {dayOfMonth(day)}
                  </span>
                  <span
                    className={`relative size-1.5 rounded-full transition-colors ${
                      hasWorkout ? (isSelected ? 'bg-accent-ink' : 'bg-accent-fg') : 'bg-transparent'
                    }`}
                  />
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

function ChevronButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-sunken hover:text-fg active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
