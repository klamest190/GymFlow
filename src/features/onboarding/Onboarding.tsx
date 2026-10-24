import { AnimatePresence, m } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CloudCheck, Dumbbell, Flame, Layers, ListPlus, Sparkles, Trophy, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSession } from '../../auth/authContext'
import { haptic } from '../../hooks/useUi'
import { RANKS } from '../../data/ranks'
import { repository } from '../../services/repository'
import { STREAK_BONUS_DAYS, XP_REWARDS } from '../../services/gamificationService'
import { ExerciseAnimation } from '../exercises/animation/ExerciseAnimation'

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
  const { user, profile } = useSession()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const firstName = profile.displayName.split(' ')[0] || 'du'

  const setGoal = (weeklyGoalDays: number) => {
    haptic()
    repository.saveProfile(user.uid, { weeklyGoalDays }).catch((error) => console.error('[GymFlow] saving weekly goal failed', error))
  }

  const steps: Step[] = [
    {
      title: `Willkommen, ${firstName}!`,
      text: 'GymFlow erfasst dein Training schnell und präzise. In vier kurzen Schritten zeigen wir dir das Wichtigste.',
      visual: <WelcomeVisual />,
    },
    {
      title: 'Training in Sekunden eintragen',
      text: 'Unter „Heute“ landet alles, was du an einem Tag trainierst.',
      points: [
        { icon: ListPlus, text: 'Übung hinzufügen, die Sätze sind schon vorbereitet' },
        { icon: Layers, text: 'Wiederholungen und Gewicht per Tipp anpassen' },
        { icon: CloudCheck, text: 'Speichert automatisch, auch ohne Empfang' },
      ],
      visual: <TrackerVisual />,
    },
    {
      title: 'Jede Übung erklärt',
      text: 'Im Katalog zeigt eine Animation die saubere Ausführung. Der Zielmuskel leuchtet grün, dazu gibt es Technik-Hinweise.',
      visual: (
        <div className="size-40">
          <ExerciseAnimation exerciseId="squats" label="Animation: Kniebeugen" />
        </div>
      ),
    },
    {
      title: 'Level aufsteigen',
      text: 'Jedes Training bringt XP. Mit jedem Level steigst du durch die Ränge, und Erfolge schaltest du dauerhaft frei.',
      points: [
        { icon: Layers, text: `+${XP_REWARDS.set} XP pro Satz` },
        { icon: Trophy, text: `+${XP_REWARDS.workout} XP pro Workout` },
        { icon: Flame, text: `+${XP_REWARDS.streakBonus} XP für ${STREAK_BONUS_DAYS} Tage in Folge` },
      ],
      visual: <RanksVisual />,
    },
    {
      title: 'Dein Wochenziel',
      text: 'An wie vielen Tagen pro Woche willst du trainieren? Du kannst es jederzeit im Profil ändern.',
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
          <div className="flex flex-1 gap-1.5" aria-label={`Schritt ${index + 1} von ${steps.length}`}>
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
              Überspringen
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
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,var(--glow-a),transparent_65%)]" />
              <div className="relative">{step.visual}</div>
            </div>
            {/* Fixed minimum height: the buttons below stay in place from step to step. */}
            <div className="min-h-62">
              <h2 id="onboarding-title" className="mt-5 text-[24px] font-bold leading-tight tracking-tight">
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
              aria-label="Zurück"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => (last ? onDone() : go(index + 1))}
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98]"
          >
            {last ? (
              <>
                <Check className="size-5" strokeWidth={3} />
                Los geht’s
              </>
            ) : (
              <>
                Weiter
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
    <m.div
      initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
      className="relative grid size-24 place-items-center rounded-[28px] bg-accent text-accent-ink shadow-accent"
    >
      <Dumbbell className="size-11" strokeWidth={2.4} />
      <m.span
        className="absolute -right-3 -top-3 grid size-9 place-items-center rounded-full bg-surface-solid text-accent-fg shadow-soft"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.45 }}
      >
        <Sparkles className="size-4.5" strokeWidth={2.5} />
      </m.span>
    </m.div>
  )
}

/** A miniature exercise card whose sets tick off one after another. */
function TrackerVisual() {
  const sets = ['10 × 60 kg', '10 × 60 kg', '8 × 62,5 kg']
  return (
    <div className="w-60 rounded-2xl bg-surface-solid p-3.5 shadow-soft">
      <p className="text-[14px] font-semibold tracking-tight">Bankdrücken</p>
      <ul className="mt-2.5 space-y-1.5">
        {sets.map((set, setIndex) => (
          <li key={setIndex} className="flex items-center justify-between rounded-xl bg-sunken px-3 py-1.5 text-[13px] font-medium tabular-nums">
            <span className="text-muted">Satz {setIndex + 1}</span>
            <span>{set}</span>
            <m.span
              className="grid size-5 place-items-center rounded-full bg-accent text-accent-ink"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.3 + setIndex * 0.35 }}
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
  return (
    <div className="flex items-end gap-2">
      {RANKS.slice(0, 5).map((rank, rankIndex) => {
        const Icon = rank.icon
        return (
          <m.span
            key={rank.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.1 + rankIndex * 0.08 }}
            className="grid place-items-center rounded-2xl"
            style={{
              background: rank.gradient,
              color: rank.ink,
              width: 36 + rankIndex * 6,
              height: 36 + rankIndex * 6,
              boxShadow: `0 10px 24px -10px ${rank.glow}`,
            }}
            title={rank.label}
          >
            <Icon className="size-1/2" strokeWidth={2.2} />
          </m.span>
        )
      })}
    </div>
  )
}

function GoalPicker({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div className="px-4 text-center">
      <p className="text-[44px] font-bold leading-none tracking-tight tabular-nums">
        {value}
        <span className="ml-1.5 text-[16px] font-semibold text-muted">{value === 1 ? 'Tag' : 'Tage'} / Woche</span>
      </p>
      <div className="mt-4 grid grid-cols-7 gap-1 rounded-2xl bg-surface-solid/70 p-1" role="radiogroup" aria-label="Trainingstage pro Woche">
        {GOAL_OPTIONS.map((days) => {
          const active = value === days
          return (
            <button
              key={days}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(days)}
              className={`relative size-9 rounded-xl text-[15px] font-bold tabular-nums transition-colors ${active ? 'text-accent-ink' : 'text-muted hover:text-fg'}`}
            >
              {active && (
                <m.span
                  layoutId="onboarding-goal"
                  className="absolute inset-0 rounded-xl bg-accent shadow-accent"
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
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
