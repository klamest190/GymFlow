import { AnimatePresence, m } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { addDays, dayOfMonth, formatFullDate, formatMonth, formatWeekday, todayKey, weekDays } from '../../lib/dates'
import { settle, snap } from '../../lib/motion'
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
    <section className="border-y border-line py-3" aria-label="Woche auswählen">
      <div className="mb-1 flex items-center justify-between px-1.5">
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

      <m.div
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
          <m.div
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
            transition={settle}
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
                  className={`relative flex flex-col items-center gap-1 rounded-xl pb-2.5 pt-2 transition-[opacity,color] disabled:opacity-30 ${
                    isSelected ? 'text-bg' : 'hover:bg-sunken'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${formatFullDate(day)}${isToday ? ', heute' : ''}${hasWorkout ? ', Training eingetragen' : ''}`}
                >
                  {isSelected && (
                    <m.span layoutId="week-selected" className="absolute inset-0 rounded-xl bg-fg" transition={snap} />
                  )}
                  <span
                    className={`relative text-[12px] ${isSelected ? 'font-medium text-bg/70' : isToday ? 'font-semibold text-fg' : 'font-medium text-muted'}`}
                  >
                    {isToday ? 'Heute' : formatWeekday(day)}
                  </span>
                  <span className="numeral relative text-[25px] leading-none">{dayOfMonth(day)}</span>
                  {/* Training days: a plate-yellow bar, like a collar on the bar. */}
                  <span className={`relative h-[3px] w-5 rounded-full ${hasWorkout ? 'bg-accent' : 'bg-transparent'}`} />
                </button>
              )
            })}
          </m.div>
        </AnimatePresence>
      </m.div>
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
      className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-sunken hover:text-fg active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
