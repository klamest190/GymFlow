import { AnimatePresence, m } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CloudCheck, Dumbbell, Flame, Layers, ListPlus, Trophy, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { settle, snap } from '../../lib/motion'
import { useSession } from '../../auth/authContext'
import { haptic } from '../../hooks/useUi'
import { RANKS } from '../../data/ranks'
import { repository } from '../../services/repository'
import { STREAK_BONUS_DAYS, XP_REWARDS } from '../../services/gamificationService'
import { ExerciseAnimation } from '../exercises/animation/ExerciseAnimation'
import { useT } from '../../i18n'

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7]
const EASE = [0.22, 1, 0.36, 1] as const

interface Step {
  title: string
  text: string
  points?: { icon: LucideIcon; text: string }[]
  visual: ReactNode
}

/**
 * First-run tour. Shown over the app until the user finishes or skips it; both mark it as
 * completed in `users/{uid}` (see App.tsx), so it appears exactly once per account, on any device.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { user, profile, isGuest } = useSession()
  const t = useT()
  const o = t.onboarding
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // A guest has no name of their own ("Gast" is only a placeholder).
  const firstName = isGuest ? null : profile.displayName.split(' ')[0] || null

  const setGoal = (weeklyGoalDays: number) => {
    haptic()
    repository.saveProfile(user.uid, { weeklyGoalDays }).catch((error) => console.error('[GymFlow] saving weekly goal failed', error))
  }

  const steps: Step[] = [
    {
      title: o.welcome(firstName),
      text: o.welcomeText,
      visual: <WelcomeVisual />,
    },
    {
      title: o.trackerTitle,
      text: o.trackerText,
      points: [
        { icon: ListPlus, text: o.trackerAdd },
        { icon: Layers, text: o.trackerLog },
        { icon: CloudCheck, text: o.trackerSync },
      ],
      visual: <TrackerVisual />,
    },
    {
      title: o.catalogTitle,
      text: o.catalogText,
      visual: (
        <div className="size-40">
          <ExerciseAnimation exerciseId="squats" label={o.squatAnimation} />
        </div>
      ),
    },
    {
      title: o.levelTitle,
      text: o.levelText,
      points: [
        { icon: Layers, text: o.xpPerSet(XP_REWARDS.set) },
        { icon: Dumbbell, text: o.xpPerVolume(XP_REWARDS.volumeKgPerXP) },
        { icon: Trophy, text: o.xpPerWorkout(XP_REWARDS.workout) },
        { icon: Flame, text: o.xpPerStreak(XP_REWARDS.streakBonus, STREAK_BONUS_DAYS) },
      ],
      visual: <RanksVisual />,
    },
    {
      title: o.goalTitle,
      text: o.goalText,
      visual: <GoalPicker value={profile.weeklyGoalDays} onChange={setGoal} />,
    },
  ]

  const last = index === steps.length - 1
  const go = (next: number) => {
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }
  const step = steps[index]

  return (
    <m.div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/40 px-4 py-[calc(env(safe-area-inset-top)+16px)] backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-md overflow-hidden rounded-4xl border border-line bg-surface-solid p-5 shadow-float sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-label={o.stepOf(index + 1, steps.length)}>
            {steps.map((_, stepIndex) => (
              <span key={stepIndex} className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                <m.span
                  className="block h-full rounded-full bg-accent"
                  initial={false}
                  animate={{ width: stepIndex <= index ? '100%' : '0%' }}
                  transition={{ duration: 0.35, ease: EASE }}
                />
              </span>
            ))}
          </div>
          {!last && (
            <button type="button" onClick={onDone} className="text-[13px] font-semibold text-muted transition hover:text-fg">
              {o.skip}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <m.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="relative mt-5 grid h-48 place-items-center overflow-hidden rounded-3xl bg-sunken">
              <div className="relative">{step.visual}</div>
            </div>
            {/* Fixed minimum height: the buttons below stay in place from step to step. */}
            <div className="min-h-62">
              <h2 id="onboarding-title" className="headline mt-5 text-[31px]">
                {step.title}
              </h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{step.text}</p>
              {step.points && (
                <ul className="mt-4 space-y-2.5">
                  {step.points.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-[15px] font-medium">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-fg">
                        <Icon className="size-4" strokeWidth={2.5} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </m.div>
        </AnimatePresence>

        <div className="mt-6 flex gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="grid size-13 shrink-0 place-items-center rounded-2xl bg-sunken text-fg transition hover:bg-surface"
              aria-label={o.back}
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => (last ? onDone() : go(index + 1))}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-[16px] font-semibold text-accent-ink transition active:scale-[0.98]"
          >
            {last ? (
              <>
                <Check className="size-5" strokeWidth={3} />
                {o.start}
              </>
            ) : (
              <>
                {o.next}
                <ArrowRight className="size-5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </m.div>
    </m.div>
  )
}

function WelcomeVisual() {
  return (
    // The plate from the app icon rolls in: the one welcome moment.
    <m.svg
      viewBox="0 0 32 32"
      className="size-28"
      aria-hidden
      initial={{ x: -40, rotate: -120, opacity: 0 }}
      animate={{ x: 0, rotate: 0, opacity: 1 }}
      transition={{ ...settle, delay: 0.1 }}
    >
      <circle cx="16" cy="16" r="15" fill="var(--accent)" />
      <circle cx="16" cy="16" r="12.4" fill="none" stroke="var(--accent-ink)" strokeOpacity={0.28} strokeWidth={0.8} />
      <circle cx="16" cy="16" r="4.8" fill="var(--accent-ink)" />
      <circle cx="16" cy="16" r="2" fill="var(--surface-solid)" />
    </m.svg>
  )
}

/** A miniature exercise card whose sets tick off one after another. */
function TrackerVisual() {
  const t = useT()
  const sets = t.onboarding.sampleSets
  return (
    <div className="w-60 rounded-2xl bg-surface-solid p-3.5 shadow-soft">
      <p className="text-[14px] font-semibold tracking-tight">{t.onboarding.sampleExercise}</p>
      <ul className="mt-2.5 space-y-1.5">
        {sets.map((set, setIndex) => (
          <li key={setIndex} className="flex items-center justify-between rounded-xl bg-sunken px-3 py-1.5 text-[13px] font-medium tabular-nums">
            <span className="text-muted">{t.onboarding.set(setIndex + 1)}</span>
            <span>{set}</span>
            <m.span
              className="grid size-5 place-items-center rounded-full bg-accent text-accent-ink"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...snap, delay: 0.3 + setIndex * 0.35 }}
            >
              <Check className="size-3" strokeWidth={3.5} />
            </m.span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RanksVisual() {
  const t = useT()
  return (
    <div className="flex items-end gap-2">
      {RANKS.slice(0, 5).map((rank, rankIndex) => {
        const Icon = rank.icon
        return (
          <m.span
            key={rank.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...settle, delay: 0.1 + rankIndex * 0.06 }}
            className="grid place-items-center rounded-full"
            style={{
              background: rank.gradient,
              color: rank.ink,
              width: 36 + rankIndex * 6,
              height: 36 + rankIndex * 6,
            }}
            title={t.gamification.ranks[rank.id]}
          >
            <Icon className="size-1/2" strokeWidth={2.2} />
          </m.span>
        )
      })}
    </div>
  )
}

function GoalPicker({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  const t = useT()
  return (
    <div className="px-4 text-center">
      <p className="text-[44px] font-bold leading-none tracking-tight tabular-nums">
        {value}
        <span className="ml-1.5 text-[16px] font-semibold text-muted">{t.onboarding.daysPerWeek(value)}</span>
      </p>
      <div className="mt-4 grid grid-cols-7 gap-1 rounded-2xl bg-surface-solid/70 p-1" role="radiogroup" aria-label={t.onboarding.goalLabel}>
        {GOAL_OPTIONS.map((days) => {
          const active = value === days
          return (
            <button
              key={days}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(days)}
              className={`relative size-9 rounded-xl text-[15px] font-bold tabular-nums transition-colors ${active ? 'text-bg' : 'text-muted hover:text-fg'}`}
            >
              {active && (
                <m.span
                  layoutId="onboarding-goal"
                  className="absolute inset-0 rounded-xl bg-fg"
                  transition={snap}
                />
              )}
              <span className="relative">{days}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
