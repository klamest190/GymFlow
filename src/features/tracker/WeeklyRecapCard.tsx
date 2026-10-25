import { AnimatePresence, m } from 'framer-motion'
import { CalendarCheck, Layers, Medal, Minus, TrendingDown, TrendingUp, Weight, X, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSession } from '../../auth/authContext'
import { addDays, formatDayMonth, isoWeek, todayKey } from '../../lib/dates'
import { formatRecordValue } from '../../lib/records'
import { formatCompact } from '../../lib/stats'
import { weeklyRecap } from '../../lib/weeklyRecap'
import { useGamification } from '../gamification/gamificationContext'

/** Dismissing is a per-device UI preference, so it lives in localStorage (week start of the recap). */
const DISMISSED_KEY = 'gymflow:recap-dismissed'

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

/** Monday to Wednesday on "Heute": last week in numbers, compared with the week before. */
export function WeeklyRecapCard() {
  const { profile } = useSession()
  const gamification = useGamification()
  const [dismissed, setDismissed] = useState(readDismissed)
  const today = todayKey()

  const recap = useMemo(
    () => (gamification ? weeklyRecap(gamification.logs, gamification.state.unlockedAchievements, profile.weeklyGoalDays, today) : null),
    [gamification, profile.weeklyGoalDays, today],
  )
  const visible = recap !== null && dismissed !== recap.weekStart

  const dismiss = () => {
    if (!recap) return
    setDismissed(recap.weekStart)
    try {
      localStorage.setItem(DISMISSED_KEY, recap.weekStart)
    } catch {
      // Blocked storage: hidden for this session only.
    }
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <m.section
          key={recap.weekStart}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
          aria-label="Wochenrückblick"
        >
          <div className="glass relative mt-5 overflow-hidden rounded-3xl p-4 sm:p-5 lg:mt-6">
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-muted">
                  Rückblick auf KW {isoWeek(recap.weekStart)}, {formatDayMonth(recap.weekStart)}–{formatDayMonth(addDays(recap.weekStart, 6))}
                </p>
                <h2 className="headline mt-1.5 text-[25px]">
                  {recap.goalReached
                    ? `Wochenziel geschafft: ${recap.week.days} von ${recap.goalDays} Tagen`
                    : recap.week.days === 0
                      ? 'Letzte Woche war Pause. Diese Woche zählt!'
                      : `${recap.week.days} von ${recap.goalDays} Trainingstagen`}
                </h2>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-sunken hover:text-fg"
                aria-label="Wochenrückblick ausblenden"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>
            </div>

            <p className="relative mt-3 text-[12px] text-muted">Veränderung jeweils im Vergleich zur Woche davor.</p>
            <div className="relative mt-2 grid grid-cols-3 gap-2">
              <Tile icon={CalendarCheck} label="Tage" value={String(recap.week.days)} change={recap.change.days} />
              <Tile icon={Layers} label="Sätze" value={formatCompact(recap.week.sets)} change={recap.change.sets} />
              <Tile icon={Weight} label="Volumen" value={`${formatCompact(recap.week.volumeKg)} kg`} change={recap.change.volumeKg} />
            </div>

            {(recap.records.length > 0 || recap.achievements.length > 0) && (
              <ul className="relative mt-3 flex flex-wrap gap-1.5">
                {recap.records.slice(0, 4).map((record) => (
                  <li
                    key={`${record.exerciseId}-${record.date}`}
                    className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-[13px] font-semibold text-accent-fg"
                  >
                    <Medal className="size-3.5" strokeWidth={2.5} />
                    {record.exerciseName}: {formatRecordValue(record.kind, record.value)}
                  </li>
                ))}
                {recap.achievements.map(({ id, title, icon: Icon }) => (
                  <li key={id} className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-semibold">
                    <Icon className="size-3.5 text-accent-fg" strokeWidth={2.5} />
                    {title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </m.section>
      )}
    </AnimatePresence>
  )
}

function Tile({ icon: Icon, label, value, change }: { icon: LucideIcon; label: string; value: string; change: number | null }) {
  return (
    <div className="rounded-2xl bg-sunken p-2.5 sm:p-3">
      <p className="flex items-center gap-1 text-[12px] font-medium text-muted">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </p>
      <p className="mt-1 truncate text-[17px] font-bold tabular-nums tracking-tight sm:text-[19px]">{value}</p>
      <Trend change={change} />
    </div>
  )
}

/** Change vs. the week before; icon + sign, so it never relies on color alone. */
function Trend({ change }: { change: number | null }) {
  if (change === null) return <p className="mt-0.5 text-[11px] text-muted">neu</p>
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  return (
    <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold tabular-nums ${change > 0 ? 'text-accent-fg' : 'text-muted'}`}>
      <Icon className="size-3" strokeWidth={2.75} />
      {change > 0 ? '+' : ''}
      {change} %
    </p>
  )
}
