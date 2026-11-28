import { AnimatePresence, m } from 'framer-motion'
import { CalendarDays, CloudCheck, CloudOff, LayoutList, LoaderCircle, Lock, Moon, Plus, Sun } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { exerciseName, getExercise, getExercises } from '../../data/exercises'
import { Loadable } from '../../components/ui/Loadable'
import { useToast } from '../../components/ui/toastContext'
import { useLogsInRange } from '../../hooks/useData'
import { useDayDraft, type SyncState } from '../../hooks/useDayDraft'
import { useSession } from '../../auth/authContext'
import { useTheme } from '../../hooks/useUi'
import { settle, snap } from '../../lib/motion'
import { formatFullDate, relativeDayLabel, todayKey, weekDays } from '../../lib/dates'
import { buildExerciseHistory } from '../../lib/exerciseHistory'
import { lastSessionBefore, nextPlannedSet } from '../../lib/plannedSet'
import { trainingDays } from '../../lib/stats'
import { createEntry, NEW_ENTRY_REPS, newSetValues, startWeightKg } from '../../lib/workoutMath'
import type { DateKey, Exercise, WorkoutEntry, WorkoutTemplate } from '../../types/models'
import { useGamification } from '../gamification/gamificationContext'
import { FigureThumb } from '../exercises/animation/FigureThumb'
import { useGuestGate } from '../guest/guestGate'
import { useRestTimer } from '../rest/restTimerContext'
import { DaySummary } from './DaySummary'
import { ExerciseEntryCard } from './ExerciseEntryCard'
import { openSetDraft } from './useSetDraft'
import { ExercisePicker } from './ExercisePicker'
import { TemplateSheet } from './TemplateSheet'
import { WeekStrip } from './WeekStrip'
import { WeeklyRecapCard } from './WeeklyRecapCard'
import { useT } from '../../i18n'

/**
 * Daily Workout Tracker: pick a day (today or any past day), add exercises from
 * the catalog and log reps/weight per set. Mobile: single column, closed by the
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
  const gate = useGuestGate()
  const t = useT()
  const exercises = getExercises()
  // Guests get no templates: the buttons show a lock and explain it.
  const openTemplates = () => (gate.isGuest ? gate.showUpgrade({ kind: 'templates' }) : setTemplatesOpen(true))
  const TemplateIcon = gate.isGuest ? Lock : LayoutList

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
    if (isToday) restTimer.start(t.tracker.restLabel(setNumber, exerciseName(entry.exerciseId, entry.exerciseName)))
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
      toast({ tone: 'info', title: t.tracker.alreadyAddedTitle, description: t.tracker.alreadyAdded(template.name) })
      return
    }
    // Only the first exercise opens its set: that's where the workout starts, and several open cards would crowd the screen.
    openFirstSet(added[0])
    update((current) => [...current, ...added])
    toast({ tone: 'success', title: t.tracker.templateApplied(template.name), description: t.tracker.exercisesAdded(added.length) })
  }

  const suggestions = exercises.filter((exercise) => !addedIds.has(exercise.id) && !gate.isLocked(exercise.id)).slice(0, 5)
  // The totals only mean something once a set is logged; until then they would show zeros.
  const hasSets = entries.some((entry) => entry.sets.length > 0)

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
              {t.tracker.exercises}
              <span className="numeral ml-2 text-[20px] text-muted">{entries.length}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openTemplates}
                className="flex items-center gap-2 rounded-xl bg-sunken px-4 py-2.5 text-[14px] font-semibold transition hover:bg-surface-solid active:scale-95"
              >
                <TemplateIcon className="size-4" strokeWidth={2.5} />
                {t.tracker.templates}
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className={`hidden items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink transition hover:brightness-105 active:scale-95 ${entries.length > 0 ? 'lg:flex' : ''}`}
              >
                <Plus className="size-4" strokeWidth={3} />
                {t.tracker.addExercise}
              </button>
            </div>
          </div>

          <Loadable ready={ready} skeleton={<EntriesSkeleton />}>
            {entries.length === 0 ? (
              <EmptyState isToday={isToday} onAdd={() => setPickerOpen(true)} />
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

          {/* Phones: the add button closes the list instead of floating over it, where it used to
              cover "Satz abhaken" and "Satz hinzufügen" (an empty day has its own buttons). */}
          {ready && entries.length > 0 && (
            <m.button
              type="button"
              onClick={() => setPickerOpen(true)}
              whileTap={{ scale: 0.97 }}
              transition={snap}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-[15px] font-semibold text-accent-ink lg:hidden"
            >
              <Plus className="size-5" strokeWidth={3} />
              {t.tracker.addExercise}
            </m.button>
          )}
        </div>

        {/* Mobile: summary sits above the entries. Desktop: sticky right column. */}
        <aside className="order-first space-y-4 lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-10">
            {hasSets && <DaySummary entries={entries} pendingXP={isToday ? (gamification?.pendingXP ?? 0) : 0} />}
            {suggestions.length > 0 && (
              <section className="hidden border-t border-line px-1 pt-5 lg:block">
                <h2 className="text-[14px] font-semibold text-muted">{t.tracker.quickAdd}</h2>
                <ul className="-mx-3 mt-2">
                  {suggestions.map((exercise) => (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        onClick={() => addExercise(exercise)}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sunken"
                      >
                        <FigureThumb exerciseId={exercise.id} className="size-11" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold tracking-tight">{exercise.name}</span>
                          <span className="text-[12px] text-muted tabular-nums">
                            {t.tracker.recommended(exercise.defaultSets, exercise.defaultReps)}
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
                  {t.tracker.openCatalog}
                </button>
              </section>
            )}
          </div>
        </aside>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={exercises}
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
  const t = useT()

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
          aria-label={t.tracker.toggleTheme}
        >
          {isDark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
        </button>
        <button
          type="button"
          onClick={() => dateInput.current?.showPicker()}
          className="relative grid size-10 place-items-center rounded-xl bg-sunken text-muted transition hover:text-fg active:scale-90"
          aria-label={t.tracker.pickDate}
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
  const t = useT()
  if (state === 'idle') return null
  const config = {
    pending: { icon: LoaderCircle, label: t.tracker.sync.pending, spin: true },
    saving: { icon: LoaderCircle, label: t.tracker.sync.saving, spin: true },
    saved: { icon: CloudCheck, label: t.tracker.sync.saved, spin: false },
    error: { icon: CloudOff, label: t.tracker.sync.error, spin: false },
  }[state]
  const Icon = config.icon
  return (
    <m.span
      key={state}
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

/**
 * An empty day: the whole card is one quiet invitation to add the first exercise.
 * An earlier day says the same thing in catch-up words.
 */
function EmptyState({ isToday, onAdd }: { isToday: boolean; onAdd: () => void }) {
  const t = useT()
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center transition-colors hover:border-fg/30 hover:bg-surface active:scale-[0.99] sm:py-14"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_8px_24px_-8px_var(--accent)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
        <Plus className="size-7" strokeWidth={2.5} />
      </span>
      <span className="headline mt-5 text-[27px]">{isToday ? t.tracker.readyTitle : t.tracker.emptyDayTitle}</span>
      <span className="mt-1 text-[15px] text-muted">{isToday ? t.tracker.readyText : t.tracker.emptyDayText}</span>
    </button>
  )
}

function EntriesSkeleton() {
  const t = useT()
  return (
    <div className="space-y-3" aria-label={t.tracker.loading}>
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
