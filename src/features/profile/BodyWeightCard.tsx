import { m } from 'framer-motion'
import { Check, LoaderCircle, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useUserId } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { useToast } from '../../components/ui/toastContext'
import { formatDaysAgo, formatDayMonth, todayKey } from '../../lib/dates'
import { parseWeight, weightChartPoints, weightTrend } from '../../lib/bodyWeight'
import { repository } from '../../services/repository'
import type { BodyWeightEntry } from '../../types/models'
import { Card } from './ProfileCard'
import { useT } from '../../i18n'
import { numberFormat } from '../../i18n/format'

const CHART_WIDTH = 300
const CHART_HEIGHT = 84
/** Body weight always with one decimal ("82,0"), so the figure doesn't jump between entries. */
const formatWeight = (value: number) => numberFormat({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)

/** Today's weigh-in, the change over ~30 days and a 90-day line. */
export function BodyWeightCard({ entries }: { entries: BodyWeightEntry[] | null }) {
  const userId = useUserId()
  const toast = useToast()
  const t = useT()
  const today = todayKey()
  const todayEntry = entries?.find((entry) => entry.date === today) ?? null
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const inputId = useId()

  const parsed = parseWeight(input)
  const trend = entries ? weightTrend(entries) : null

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (parsed === null || saving) return
    setSaving(true)
    try {
      await repository.saveBodyWeight(userId, today, parsed)
      setInput('')
    } catch (error) {
      toast({ tone: 'error', title: t.profile.weightNotSaved, description: authErrorMessage(error) })
    }
    setSaving(false)
  }

  const removeToday = () =>
    repository
      .deleteBodyWeight(userId, today)
      .catch((error) => toast({ tone: 'error', title: t.profile.deleteFailed, description: authErrorMessage(error) }))

  return (
    <Card title={t.profile.bodyWeight} description={t.profile.bodyWeightText}>
      {entries === null ? (
        <div className="skeleton h-32 rounded-2xl" />
      ) : (
        <>
          {trend && (
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="numeral text-[39px] leading-none">
                  {formatWeight(trend.latest.weightKg)}
                  <span className="ml-1 text-[20px] text-muted">kg</span>
                </p>
                <p className="mt-1 text-[13px] text-muted">{formatDaysAgo(trend.latest.date)}</p>
              </div>
              {trend.change !== null && trend.days !== null && <Change change={trend.change} days={trend.days} />}
            </div>
          )}

          <WeightChart entries={entries} today={today} />

          <form onSubmit={save} className="mt-4 flex gap-2">
            <label htmlFor={inputId} className="sr-only">
              {t.profile.weightToday}
            </label>
            <div className="flex min-w-0 flex-1 items-center rounded-xl bg-sunken pr-4 ring-fg/40 focus-within:ring-2">
              <input
                id={inputId}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                inputMode="decimal"
                placeholder={todayEntry ? t.profile.todayValue(formatWeight(todayEntry.weightKg)) : t.profile.weightPlaceholder}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] outline-none placeholder:text-muted/70"
              />
              <span className="text-[14px] font-semibold text-muted">kg</span>
            </div>
            <button
              type="submit"
              disabled={parsed === null || saving}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-ink transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}
              {todayEntry ? t.profile.replace : t.profile.save}
            </button>
          </form>
          {input.trim() !== '' && parsed === null && <p className="mt-1.5 px-1 text-[13px] font-medium text-danger">{t.profile.weightRange}</p>}
          {todayEntry && (
            <button type="button" onClick={removeToday} className="mt-2 px-1 text-[13px] font-semibold text-muted transition hover:text-danger">
              {t.profile.deleteToday}
            </button>
          )}
        </>
      )}
    </Card>
  )
}

/** Up or down, with icon and sign; weight change isn't "good" or "bad" per se, so no colors. */
function Change({ change, days }: { change: number; days: number }) {
  const t = useT()
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  return (
    <p className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1.5 text-[13px] font-semibold tabular-nums">
      <Icon className="size-3.5" strokeWidth={2.75} />
      {change > 0 ? '+' : ''}
      {t.profile.changeInDays(formatWeight(change), days)}
    </p>
  )
}

function WeightChart({ entries, today }: { entries: BodyWeightEntry[]; today: string }) {
  const points = weightChartPoints(entries, today, CHART_WIDTH, CHART_HEIGHT)
  const gradientId = useId()
  const t = useT()
  if (points.length === 0) {
    return (
      <p className="mt-4 rounded-xl bg-sunken px-4 py-3.5 text-[13px] text-muted">
        {entries.length === 0 ? t.profile.noEntries : t.profile.twoEntries}
      </p>
    )
  }
  const line = points.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${points.at(-1)!.x.toFixed(1)},${CHART_HEIGHT} L${points[0].x.toFixed(1)},${CHART_HEIGHT} Z`
  const last = points.at(-1)!
  return (
    <figure className="mt-4">
      <svg viewBox={`-4 -6 ${CHART_WIDTH + 8} ${CHART_HEIGHT + 12}`} className="h-24 w-full" preserveAspectRatio="none" role="img" aria-label={t.profile.weightChart}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--figure-highlight)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--figure-highlight)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* The chart stretches to the card width, so strokes use non-scaling-stroke (constant
            thickness) and the end dot is a zero-length round line instead of a circle. */}
        <m.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--figure-highlight)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={last.x}
            y1={last.y}
            x2={last.x}
            y2={last.y}
            stroke="var(--figure-highlight)"
            strokeWidth={9}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </m.g>
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted tabular-nums">
        <span>{formatDayMonth(points[0].entry.date)}</span>
        <span>{t.profile.entries(points.length)}</span>
        <span>{formatDayMonth(last.entry.date)}</span>
      </figcaption>
    </figure>
  )
}
