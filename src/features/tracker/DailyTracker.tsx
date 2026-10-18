import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CloudCheck, CloudOff, Dumbbell, LoaderCircle, Moon, Plus, Sun } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EXERCISES, getExercise } from '../../data/exercises'
import { useLogsInRange } from '../../hooks/useData'
import { useDayDraft, type SyncState } from '../../hooks/useDayDraft'
import { useUserId } from '../../hooks/useSession'
import { useTheme } from '../../hooks/useUi'
import { formatFullDate, relativeDayLabel, todayKey, weekDays } from '../../lib/dates'
import { createEntry } from '../../lib/workoutMath'
import type { DateKey, Exercise, WorkoutEntry } from '../../types/models'
import { DaySummary } from './DaySummary'
import { ExerciseEntryCard } from './ExerciseEntryCard'
import { ExercisePicker } from './ExercisePicker'
import { WeekStrip } from './WeekStrip'

/**
 * Daily Workout Tracker: pick a day (today or any past day), add exercises from
 * the catalog and log reps/weight per set. Mobile: single column with a floating
 * add button. Desktop: entries on the left, sticky summary + quick add on the right.
 */
export function DailyTracker() {
  const userId = useUserId()
  const [date, setDate] = useState<DateKey>(todayKey)
  const [pickerOpen, setPickerOpen] = useState(false)

  const week = weekDays(date)
  const { logs, ready } = useLogsInRange(userId, week[0], week[6])
  const remote = logs.find((log) => log.date === date) ?? null
  const { entries, update, syncState } = useDayDraft(userId, date, remote, ready)

  const activeDates = useMemo(() => new Set(logs.map((log) => log.date)), [logs])
  const addedIds = useMemo(() => new Set(entries.map((entry) => entry.exerciseId)), [entries])

  const addExercise = useCallback(
    (exercise: Exercise) => update((current) => [...current, createEntry(exercise, current.length)]),
    [update],
  )
  const changeEntry = (next: WorkoutEntry) => update((current) => current.map((entry) => (entry.id === next.id ? next : entry)))
  const removeEntry = (id: string) => update((current) => current.filter((entry) => entry.id !== id))

  const suggestions = EXERCISES.filter((exercise) => !addedIds.has(exercise.id)).slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl">
      <TrackerHeader date={date} onDateChange={setDate} syncState={syncState} />

      <div className="mt-5 lg:mt-8">
        <WeekStrip selected={date} onSelect={setDate} activeDates={activeDates} />
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          <div className="flex items-center justify-between px-1 pt-2">
            <h2 className="text-[22px] font-bold tracking-tight">
              Übungen
              <span className="ml-2 text-[17px] font-semibold text-muted tabular-nums">{entries.length}</span>
            </h2>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="hidden items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink shadow-accent transition hover:brightness-105 active:scale-95 lg:flex"
            >
              <Plus className="size-4" strokeWidth={3} />
              Übung hinzufügen
            </button>
          </div>

          {!ready ? (
            <EntriesSkeleton />
          ) : entries.length === 0 ? (
            <EmptyState isToday={date === todayKey()} onAdd={() => setPickerOpen(true)} />
          ) : (
            <motion.ul layout className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {entries.map((entry) => (
                  <motion.li
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -60, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  >
                    <ExerciseEntryCard
                      entry={entry}
                      exercise={getExercise(entry.exerciseId)}
                      onChange={changeEntry}
                      onRemove={() => removeEntry(entry.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>

        {/* Mobile: summary sits above the entries. Desktop: sticky right column. */}
        <aside className="order-first space-y-4 lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-10">
            <DaySummary entries={entries} />
            {suggestions.length > 0 && (
              <section className="glass hidden rounded-3xl p-5 lg:block">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Schnell hinzufügen</h2>
                <ul className="mt-3 space-y-1">
                  {suggestions.map((exercise) => (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        onClick={() => addExercise(exercise)}
                        className="group flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-sunken"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold tracking-tight">{exercise.name}</span>
                          <span className="text-[12px] text-muted tabular-nums">
                            {exercise.defaultSets} × {exercise.defaultReps}
                          </span>
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sunken transition group-hover:bg-accent group-hover:text-accent-ink">
                          <Plus className="size-4" strokeWidth={2.75} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-2 w-full rounded-2xl py-2.5 text-[14px] font-semibold text-accent-fg transition hover:bg-accent/10"
                >
                  Gesamten Katalog öffnen
                </button>
              </section>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile floating action button above the tab bar. Portaled because the page
          transition's transform/filter would otherwise become its containing block. */}
      {createPortal(
      <motion.button
        type="button"
        onClick={() => setPickerOpen(true)}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.15 }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+100px)] right-5 z-30 flex items-center gap-2 rounded-full bg-accent py-4 pl-5 pr-6 text-[15px] font-semibold text-accent-ink shadow-[var(--shadow-accent),var(--shadow-float)] lg:hidden"
        aria-label="Übung hinzufügen"
      >
        <Plus className="size-5" strokeWidth={3} />
        Übung
      </motion.button>,
        document.body,
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={EXERCISES}
        addedIds={addedIds}
        onAdd={addExercise}
      />
    </div>
  )
}

function TrackerHeader({ date, onDateChange, syncState }: { date: DateKey; onDateChange: (date: DateKey) => void; syncState: SyncState }) {
  const dateInput = useRef<HTMLInputElement>(null)
  const { isDark, toggle } = useTheme()

  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{formatFullDate(date)}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-1 truncate text-[34px] font-bold leading-none tracking-tight lg:text-[44px]"
          >
            {relativeDayLabel(date)}
          </motion.h1>
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SyncBadge state={syncState} />
        <button
          type="button"
          onClick={toggle}
          className="glass grid size-10 place-items-center rounded-full text-muted transition hover:text-fg active:scale-90 lg:hidden"
          aria-label="Farbschema wechseln"
        >
          {isDark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
        </button>
        <button
          type="button"
          onClick={() => dateInput.current?.showPicker()}
          className="glass relative grid size-10 place-items-center rounded-full text-muted transition hover:text-fg active:scale-90"
          aria-label="Datum wählen"
        >
          <CalendarDays className="size-4.5" />
          <input
            ref={dateInput}
            type="date"
            max={todayKey()}
            value={date}
            onChange={(event) => event.target.value && onDateChange(event.target.value)}
            className="pointer-events-none absolute inset-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </button>
      </div>
    </header>
  )
}

function SyncBadge({ state }: { state: SyncState }) {
  if (state === 'idle') return null
  const config = {
    pending: { icon: LoaderCircle, label: 'Speichert', spin: true },
    saving: { icon: LoaderCircle, label: 'Speichert', spin: true },
    saved: { icon: CloudCheck, label: 'Gespeichert', spin: false },
    error: { icon: CloudOff, label: 'Fehler', spin: false },
  }[state]
  const Icon = config.icon
  return (
    <motion.span
      key={config.label}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium sm:flex ${
        state === 'error' ? 'text-danger' : 'text-muted'
      }`}
      role="status"
    >
      <Icon className={`size-4 ${config.spin ? 'animate-spin' : ''} ${state === 'saved' ? 'text-accent-fg' : ''}`} />
      {config.label}
    </motion.span>
  )
}

function EmptyState({ isToday, onAdd }: { isToday: boolean; onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-accent/40 blur-2xl" />
        <div className="relative grid size-16 place-items-center rounded-full bg-accent text-accent-ink shadow-accent">
          <Dumbbell className="size-7" strokeWidth={2.25} />
        </div>
      </div>
      <h3 className="mt-5 text-[20px] font-bold tracking-tight">
        {isToday ? 'Bereit fürs Training?' : 'An diesem Tag ist nichts eingetragen'}
      </h3>
      <p className="mt-1.5 max-w-xs text-[15px] text-muted">
        {isToday ? 'Füge deine erste Übung hinzu und tracke Sätze und Wiederholungen.' : 'Trage dein Training einfach nachträglich ein.'}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink shadow-accent transition active:scale-95"
      >
        <Plus className="size-4.5" strokeWidth={3} />
        Übung hinzufügen
      </button>
    </motion.div>
  )
}

function EntriesSkeleton() {
  return (
    <div className="space-y-3" aria-busy>
      {[0, 1].map((index) => (
        <div key={index} className="glass h-44 animate-pulse rounded-3xl" />
      ))}
    </div>
  )
}
