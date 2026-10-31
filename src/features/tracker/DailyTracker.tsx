import { AnimatePresence, m } from 'framer-motion'
import { CalendarDays, CloudCheck, CloudOff, LayoutList, LoaderCircle, Moon, Plus, Sun } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EXERCISES, getExercise } from '../../data/exercises'
import { Loadable } from '../../components/ui/Loadable'
import { useToast } from '../../components/ui/toastContext'
import { useLogsInRange } from '../../hooks/useData'
import { useDayDraft, type SyncState } from '../../hooks/useDayDraft'
import { useSession } from '../../auth/authContext'
import { useTheme } from '../../hooks/useUi'
import { settle } from '../../lib/motion'
import { formatFullDate, relativeDayLabel, todayKey, weekDays } from '../../lib/dates'
import { buildExerciseHistory } from '../../lib/exerciseHistory'
import { lastSessionBefore, nextPlannedSet } from '../../lib/plannedSet'
import { trainingDays } from '../../lib/stats'
import { createEntry, NEW_ENTRY_REPS, newSetValues, startWeightKg } from '../../lib/workoutMath'
import type { DateKey, Exercise, WorkoutEntry, WorkoutTemplate } from '../../types/models'
import { useGamification } from '../gamification/gamificationContext'
import { REST_BAR_HEIGHT } from '../rest/RestTimerBar'
import { useRestTimer } from '../rest/restTimerContext'
import { DaySummary } from './DaySummary'
import { ExerciseEntryCard } from './ExerciseEntryCard'
import { openSetDraft } from './useSetDraft'
import { ExercisePicker } from './ExercisePicker'
import { TemplateSheet } from './TemplateSheet'
import { WeekStrip } from './WeekStrip'
import { WeeklyRecapCard } from './WeeklyRecapCard'

/**
 * Daily Workout Tracker: pick a day (today or any past day), add exercises from
 * the catalog and log reps/weight per set. Mobile: single column with a floating
 * add button. Desktop: entries on the left, sticky summary + quick add on the right.
 */
export function DailyTracker() {
  const { user, profile } = useSession()
  const userId = user.uid
  const [date, setDate] = useState<DateKey>(todayKey)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const toast = useToast()
  const gamification = useGamification()

  const week = weekDays(date)
  const { logs, ready } = useLogsInRange(userId, week[0], week[6])
  const remote = logs.find((log) => log.date === date) ?? null
  const { entries, update, syncState } = useDayDraft(userId, date, remote, ready)
  const restTimer = useRestTimer()
  const isToday = date === todayKey()

  const activeDates = useMemo(() => new Set(trainingDays(logs).map((log) => log.date)), [logs])
  const addedIds = useMemo(() => new Set(entries.map((entry) => entry.exerciseId)), [entries])
  // "Letztes Mal" per exercise; the whole history is loaded once by the gamification provider.
  const history = useMemo(() => buildExerciseHistory(gamification?.logs ?? []), [gamification?.logs])

  const fallbackFor = (entry: WorkoutEntry) => {
    const exercise = getExercise(entry.exerciseId)
    return exercise ? newSetValues(exercise, profile.dumbbellKg) : { reps: NEW_ENTRY_REPS, weightKg: entry.usesWeight ? profile.dumbbellKg : null }
  }
  const previousOf = (entry: WorkoutEntry) => lastSessionBefore(history, entry.exerciseId, date)?.entry ?? null

  // A newly added exercise comes with set 1 already open, prefilled like any next set.
  const openFirstSet = (entry: WorkoutEntry) => openSetDraft(entry.id, nextPlannedSet(entry, previousOf(entry), fallbackFor(entry)))

  const addExercise = (exercise: Exercise) => {
    const entry = createEntry(exercise, 0)
    openFirstSet(entry)
    update((current) => [...current, { ...entry, position: current.length }])
  }
  const changeEntry = (next: WorkoutEntry) => update((current) => current.map((entry) => (entry.id === next.id ? next : entry)))
  const removeEntry = (id: string) => update((current) => current.filter((entry) => entry.id !== id))

  // Rest only between sets done right now, not while catching up on an earlier day.
  const startRest = (entry: WorkoutEntry, setNumber: number) => {
    if (isToday) restTimer.start(`Pause nach Satz ${setNumber}, ${entry.exerciseName}`)
  }

  // Appends the template's exercises without sets; exercises already on the day stay as they are.
  // The template's values only fill the preview of exercises without an earlier session.
  const applyTemplate = (template: WorkoutTemplate) => {
    const added = template.exercises.flatMap((item) => {
      const exercise = getExercise(item.exerciseId)
      if (!exercise || addedIds.has(item.exerciseId)) return []
      const entry = createEntry(exercise, 0)
      if (item.sets.length === 0) return [entry]
      // Sets saved without a weight start at the user's dumbbell weight.
      const plannedSets = item.sets.map((set) => ({
        reps: set.reps,
        weightKg: exercise.usesWeight ? (set.weightKg ?? startWeightKg(exercise, profile.dumbbellKg)) : null,
      }))
      return [{ ...entry, plannedSets }]
    })
    setTemplatesOpen(false)
    if (added.length === 0) {
      toast({ tone: 'info', title: 'Schon eingetragen', description: `Alle Übungen aus „${template.name}“ sind an diesem Tag bereits drin.` })
      return
    }
    // Only the first exercise opens its set: that's where the workout starts, and several open cards would crowd the screen.
    openFirstSet(added[0])
    update((current) => [...current, ...added])
    toast({ tone: 'success', title: `„${template.name}“ eingetragen`, description: `${added.length} ${added.length === 1 ? 'Übung' : 'Übungen'} hinzugefügt.` })
  }

  const suggestions = EXERCISES.filter((exercise) => !addedIds.has(exercise.id)).slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl">
      <TrackerHeader date={date} onDateChange={setDate} syncState={syncState} />

      <WeeklyRecapCard />

      <div className="mt-5 lg:mt-8">
        <WeekStrip selected={date} onSelect={setDate} activeDates={activeDates} />
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          <div className="flex items-center justify-between px-1 pt-2">
            <h2 className="headline text-[31px]">
              Übungen
              <span className="numeral ml-2 text-[20px] text-muted">{entries.length}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTemplatesOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-sunken px-4 py-2.5 text-[14px] font-semibold transition hover:bg-surface-solid active:scale-95"
              >
                <LayoutList className="size-4" strokeWidth={2.5} />
                Vorlagen
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className={`hidden items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink transition hover:brightness-105 active:scale-95 ${entries.length > 0 ? 'lg:flex' : ''}`}
              >
                <Plus className="size-4" strokeWidth={3} />
                Übung hinzufügen
              </button>
            </div>
          </div>

          <Loadable ready={ready} skeleton={<EntriesSkeleton />}>
            {entries.length === 0 ? (
              <EmptyState isToday={isToday} onAdd={() => setPickerOpen(true)} onTemplates={() => setTemplatesOpen(true)} />
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {entries.map((entry) => (
                    <m.li
                      key={entry.id}
                      layout="position"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -60, transition: { duration: 0.18 } }}
                      transition={settle}
                    >
                      <ExerciseEntryCard
                        entry={entry}
                        exercise={getExercise(entry.exerciseId)}
                        previous={previousOf(entry)}
                        fallback={fallbackFor(entry)}
                        onChange={changeEntry}
                        onRemove={() => removeEntry(entry.id)}
                        onSetLogged={(setNumber) => startRest(entry, setNumber)}
                      />
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Loadable>
        </div>

        {/* Mobile: summary sits above the entries. Desktop: sticky right column. */}
        <aside className="order-first space-y-4 lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-10">
            {entries.length > 0 && <DaySummary entries={entries} pendingXP={isToday ? (gamification?.pendingXP ?? 0) : 0} />}
            {suggestions.length > 0 && (
              <section className="hidden border-t border-line px-1 pt-5 lg:block">
                <h2 className="text-[14px] font-semibold text-muted">Schnell hinzufügen</h2>
                <ul className="-mx-3 mt-2">
                  {suggestions.map((exercise) => (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        onClick={() => addExercise(exercise)}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sunken"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold tracking-tight">{exercise.name}</span>
                          <span className="text-[12px] text-muted tabular-nums">
                            Empfohlen: {exercise.defaultSets} × {exercise.defaultReps}
                          </span>
                        </span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sunken transition group-hover:bg-fg group-hover:text-bg">
                          <Plus className="size-4" strokeWidth={2.75} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-2 text-[14px] font-semibold text-muted underline-offset-4 transition hover:text-fg hover:underline"
                >
                  Gesamten Katalog öffnen
                </button>
              </section>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile floating action button above the tab bar (and the rest bar), once the day has entries
          (an empty day has its own buttons). Portaled so it stays outside the page transition's fading wrapper. */}
      {entries.length > 0 && createPortal(
      <m.button
        type="button"
        onClick={() => setPickerOpen(true)}
        whileTap={{ scale: 0.92 }}
        style={restTimer.rest ? { bottom: `calc(env(safe-area-inset-bottom) + ${84 + REST_BAR_HEIGHT}px)` } : undefined}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] right-4 z-30 flex items-center gap-2 rounded-xl bg-accent py-4 pl-5 pr-6 text-[15px] font-semibold text-accent-ink shadow-float lg:hidden"
        aria-label="Übung hinzufügen"
      >
        <Plus className="size-5" strokeWidth={3} />
        Übung
      </m.button>,
        document.body,
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={EXERCISES}
        addedIds={addedIds}
        onAdd={addExercise}
      />
      <TemplateSheet open={templatesOpen} onClose={() => setTemplatesOpen(false)} entries={entries} onApply={applyTemplate} />
    </div>
  )
}

function TrackerHeader({ date, onDateChange, syncState }: { date: DateKey; onDateChange: (date: DateKey) => void; syncState: SyncState }) {
  const dateInput = useRef<HTMLInputElement>(null)
  const { isDark, toggle } = useTheme()

  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <m.h1
            key={date}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="headline text-[39px] lg:text-[49px] truncate"
          >
            {relativeDayLabel(date)}
          </m.h1>
        </AnimatePresence>
        <p className="mt-2 text-[15px] text-muted">{formatFullDate(date)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SyncBadge state={syncState} />
        <button
          type="button"
          onClick={toggle}
          className="grid size-10 place-items-center rounded-xl bg-sunken text-muted transition hover:text-fg active:scale-90 lg:hidden"
          aria-label="Farbschema wechseln"
        >
          {isDark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
        </button>
        <button
          type="button"
          onClick={() => dateInput.current?.showPicker()}
          className="relative grid size-10 place-items-center rounded-xl bg-sunken text-muted transition hover:text-fg active:scale-90"
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
    <m.span
      key={config.label}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`hidden h-10 items-center gap-1.5 px-1 text-[13px] font-medium sm:flex ${
        state === 'error' ? 'text-danger' : 'text-muted'
      }`}
      role="status"
    >
      <Icon className={`size-4 ${config.spin ? 'animate-spin' : ''} ${state === 'saved' ? 'text-accent-fg' : ''}`} />
      {config.label}
    </m.span>
  )
}

function EmptyState({ isToday, onAdd, onTemplates }: { isToday: boolean; onAdd: () => void; onTemplates: () => void }) {
  return (
    <div className="glass flex flex-col items-center rounded-3xl px-6 py-12 text-center">
      <h3 className="headline text-[31px]">
        {isToday ? 'Bereit fürs Training?' : 'An diesem Tag ist nichts eingetragen'}
      </h3>
      <p className="mt-1.5 max-w-xs text-[15px] text-muted">
        {isToday ? 'Füge deine erste Übung hinzu und tracke Sätze und Wiederholungen.' : 'Trage dein Training einfach nachträglich ein.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-accent-ink transition active:scale-95"
        >
          <Plus className="size-4.5" strokeWidth={3} />
          Übung hinzufügen
        </button>
        <button
          type="button"
          onClick={onTemplates}
          className="flex items-center gap-2 rounded-xl bg-sunken px-5 py-3 text-[15px] font-semibold transition hover:bg-surface-solid active:scale-95"
        >
          <LayoutList className="size-4.5" strokeWidth={2.5} />
          Vorlage verwenden
        </button>
      </div>
    </div>
  )
}

function EntriesSkeleton() {
  return (
    <div className="space-y-3" aria-label="Training wird geladen">
      {[0, 1].map((index) => (
        <div key={index} className="glass rounded-3xl p-5">
          <span className="skeleton block h-4 w-2/5 rounded-md" />
          <span className="skeleton mt-2.5 block h-3 w-1/4 rounded-md" />
          <span className="skeleton mt-5 block h-16 rounded-2xl" />
        </div>
      ))}
    </div>
  )
}
