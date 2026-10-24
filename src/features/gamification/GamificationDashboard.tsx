import { m, type Variants } from 'framer-motion'
import { Check, Dumbbell, Flame, Layers, Lock, Trophy } from 'lucide-react'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { Loadable } from '../../components/ui/Loadable'
import { ACHIEVEMENTS, type AchievementDefinition, type ProgressMetrics } from '../../data/achievements'
import { RANK_BY_ID, RANKS, type RankDefinition } from '../../data/ranks'
import { formatFullDate } from '../../lib/dates'
import {
  STREAK_BONUS_DAYS,
  XP_REWARDS,
  achievementProgress,
  nextRank,
  type ProgressEvaluation,
} from '../../services/gamificationService'
import type { DateKey } from '../../types/models'
import { useGamification } from './gamificationContext'
import { RankBadge } from './RankBadge'

const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 })
const format = (value: number) => numberFormatter.format(value)

const tileMotion: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  shown: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 360, damping: 30, delay: 0.15 + index * 0.04 },
  }),
}

/** Level, rank and achievements of the signed-in user (profile tab). */
export function GamificationDashboard() {
  const evaluation = useGamification()
  return (
    <Loadable ready={evaluation !== null} skeleton={<DashboardSkeleton />}>
      {evaluation && (
        <div className="space-y-4">
          <LevelCard evaluation={evaluation} />
          <AchievementGrid unlocked={evaluation.state.unlockedAchievements} metrics={evaluation.summary.metrics} />
        </div>
      )}
    </Loadable>
  )
}

// ─── Level & rank ────────────────────────────────────────────────────────────

function LevelCard({ evaluation }: { evaluation: ProgressEvaluation }) {
  const { progress, summary, state } = evaluation
  const rank = RANK_BY_ID[state.rank]
  const upcoming = nextRank(rank)
  const percent = Math.floor(progress.ratio * 100)

  return (
    <section className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5" aria-label="Level und Rang">
      {/* Soft glow in the rank's color behind the emblem. */}
      <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-60 blur-3xl" style={{ background: rank.glow }} />

      <div className="relative flex items-center gap-4">
        <RankEmblem rank={rank} level={progress.level} />
        <div className="min-w-0 flex-1">
          <RankBadge rank={rank} />
          <p className="mt-1.5 text-[34px] font-bold leading-none tracking-tight tabular-nums">
            Level <AnimatedNumber value={progress.level} />
          </p>
          <p className="mt-1 text-[13px] text-muted">
            <AnimatedNumber value={summary.totalXP} className="font-semibold text-fg tabular-nums" /> XP gesamt
          </p>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
          <p className="font-medium">
            <span className="font-semibold tabular-nums">{format(progress.currentXP)}</span>
            <span className="text-muted"> / {format(progress.requiredXP)} XP bis Level {progress.level + 1}</span>
          </p>
          <p className="font-semibold tabular-nums text-accent-fg">{percent} %</p>
        </div>
        <XPBar ratio={progress.ratio} current={progress.currentXP} required={progress.requiredXP} level={progress.level} />
        <p className="mt-2 text-[12px] text-muted">
          {upcoming
            ? `Noch ${upcoming.minLevel - progress.level} Level bis ${upcoming.label}`
            : 'Höchster Rang erreicht. Respekt!'}
        </p>
      </div>

      <RankLadder current={rank} />

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <XPSource icon={Layers} label="Sätze" xp={summary.xp.sets} rule={`+${XP_REWARDS.set} je Satz`} />
        <XPSource
          icon={Dumbbell}
          label="Gewicht"
          xp={summary.xp.volume}
          rule={`+1 je ${XP_REWARDS.volumeKgPerXP} kg bewegt, max. ${XP_REWARDS.volumeMaxPerSet} je Satz`}
        />
        <XPSource icon={Trophy} label="Workouts" xp={summary.xp.workouts} rule={`+${XP_REWARDS.workout} je Workout`} />
        <XPSource icon={Flame} label="Streaks" xp={summary.xp.streaks} rule={`+${XP_REWARDS.streakBonus} je ${STREAK_BONUS_DAYS} Tage am Stück`} />
      </div>
    </section>
  )
}

function RankEmblem({ rank, level }: { rank: RankDefinition; level: number }) {
  const Icon = rank.icon
  return (
    <m.div
      key={rank.id}
      initial={{ scale: 0.7, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
      className="relative grid size-20 shrink-0 place-items-center rounded-[26px] sm:size-24"
      style={{ background: rank.gradient, color: rank.ink, boxShadow: `0 14px 34px -10px ${rank.glow}` }}
      aria-hidden
    >
      {/* Glass highlight on the upper half. */}
      <span className="absolute inset-x-1.5 top-1.5 h-1/2 rounded-[20px] bg-linear-to-b from-white/35 to-transparent" />
      <Icon className="relative size-9 sm:size-10" strokeWidth={2.2} />
      <span className="absolute -bottom-2 rounded-full bg-surface-solid px-2 py-0.5 text-[12px] font-bold tabular-nums text-fg shadow-soft">
        {level}
      </span>
    </m.div>
  )
}

function XPBar({ ratio, current, required, level }: { ratio: number; current: number; required: number; level: number }) {
  return (
    <div
      className="relative h-3.5 overflow-hidden rounded-full bg-sunken"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={required}
      aria-valuenow={current}
      aria-label={`Fortschritt zu Level ${level + 1}`}
    >
      <m.div
        className="relative h-full overflow-hidden rounded-full bg-linear-to-r from-accent/70 to-accent shadow-accent"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(ratio * 100, ratio > 0 ? 3 : 0)}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.15 }}
      >
        {/* Soft light passing through the filled part every few seconds. */}
        <m.span
          aria-hidden
          className="absolute inset-y-0 w-16 bg-linear-to-r from-transparent via-white/50 to-transparent"
          initial={{ x: '-4rem' }}
          animate={{ x: '40rem' }}
          transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3, delay: 1.2 }}
        />
      </m.div>
    </div>
  )
}

function RankLadder({ current }: { current: RankDefinition }) {
  const currentIndex = RANKS.indexOf(current)
  return (
    <ol className="relative mt-5 grid grid-cols-7 gap-1" aria-label="Ränge">
      {RANKS.map((rank, index) => {
        const reached = index <= currentIndex
        const Icon = rank.icon
        return (
          <li key={rank.id} className="flex flex-col items-center gap-1 text-center" aria-current={rank === current ? 'step' : undefined}>
            <span
              className={`grid size-8 place-items-center rounded-xl transition sm:size-9 ${reached ? '' : 'bg-sunken text-muted opacity-60'} ${
                rank === current ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-solid' : ''
              }`}
              style={reached ? { background: rank.gradient, color: rank.ink } : undefined}
              title={`${rank.label} ab Level ${rank.minLevel}`}
            >
              <Icon className="size-4" strokeWidth={2.4} />
            </span>
            <span className={`w-full truncate text-[10px] font-semibold leading-tight ${rank === current ? 'text-fg' : 'text-muted'}`}>
              {rank.label}
            </span>
            <span className="hidden text-[10px] leading-none text-muted tabular-nums sm:block">Lv {rank.minLevel}</span>
          </li>
        )
      })}
    </ol>
  )
}

function XPSource({ icon: Icon, label, xp, rule }: { icon: typeof Layers; label: string; xp: number; rule: string }) {
  return (
    <div className="rounded-2xl bg-sunken p-2.5 sm:p-3">
      <p className="flex items-center gap-1 text-[12px] font-medium text-muted">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </p>
      <p className="mt-1 text-[15px] font-bold tabular-nums tracking-tight sm:text-[17px]">
        <AnimatedNumber value={xp} compact /> <span className="text-[11px] font-semibold text-muted">XP</span>
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted">{rule}</p>
    </div>
  )
}

// ─── Achievements ────────────────────────────────────────────────────────────

function AchievementGrid({ unlocked, metrics }: { unlocked: Record<string, DateKey>; metrics: ProgressMetrics }) {
  const unlockedCount = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length
  return (
    <section className="glass rounded-3xl p-4 sm:p-5" aria-label="Erfolge">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Erfolge</h2>
        <p className="text-[13px] font-semibold tabular-nums text-muted">
          <span className="text-accent-fg">{unlockedCount}</span> / {ACHIEVEMENTS.length}
        </p>
      </div>
      <p className="mt-0.5 text-[13px] text-muted">Meilensteine, die du einmal freischaltest und für immer behältst.</p>
      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {ACHIEVEMENTS.map((achievement, index) => (
          <m.li key={achievement.id} variants={tileMotion} initial="hidden" animate="shown" custom={index}>
            <AchievementTile achievement={achievement} unlockedOn={unlocked[achievement.id] ?? null} metrics={metrics} />
          </m.li>
        ))}
      </ul>
    </section>
  )
}

function AchievementTile({
  achievement,
  unlockedOn,
  metrics,
}: {
  achievement: AchievementDefinition
  unlockedOn: DateKey | null
  metrics: ProgressMetrics
}) {
  const Icon = achievement.icon
  const unlocked = unlockedOn !== null
  const progress = achievementProgress(achievement, metrics)

  return (
    <m.div
      whileHover={unlocked ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={`flex h-full flex-col items-center rounded-2xl p-3 text-center transition-shadow ${
        unlocked ? 'bg-accent/10 ring-1 ring-accent/30 hover:shadow-soft' : 'bg-sunken'
      }`}
    >
      <span
        className={`relative grid size-12 place-items-center rounded-2xl ${
          unlocked ? 'bg-accent text-accent-ink shadow-accent' : 'bg-surface-solid/60 text-muted'
        }`}
      >
        <Icon className={`size-6 ${unlocked ? '' : 'opacity-50'}`} strokeWidth={2.2} />
        {!unlocked && (
          <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-surface-solid text-muted shadow-soft">
            <Lock className="size-3" strokeWidth={2.5} />
          </span>
        )}
      </span>
      <p className={`mt-2.5 text-[14px] font-semibold leading-tight tracking-tight ${unlocked ? '' : 'text-muted'}`}>{achievement.title}</p>
      <p className={`mt-0.5 text-[12px] leading-snug text-muted ${unlocked ? '' : 'opacity-80'}`}>{achievement.description}</p>

      <div className="mt-auto w-full pt-2.5">
        {unlocked ? (
          <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-accent-fg">
            <Check className="size-3" strokeWidth={3} />
            {formatFullDate(unlockedOn)}
          </p>
        ) : achievement.unit ? (
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-solid/70">
              <m.div
                className="h-full rounded-full bg-muted"
                initial={{ width: 0 }}
                animate={{ width: `${progress.ratio * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.3 }}
              />
            </div>
            <p className="mt-1 text-[11px] font-medium tabular-nums text-muted">
              {format(progress.value)} / {format(achievement.threshold)} {achievement.unit}
            </p>
          </>
        ) : (
          <p className="text-[11px] font-medium text-muted">Noch gesperrt</p>
        )}
      </div>
    </m.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Level wird geladen">
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <div className="skeleton size-20 rounded-[26px]" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-8 w-36 rounded-xl" />
          </div>
        </div>
        <div className="skeleton mt-5 h-3.5 rounded-full" />
      </div>
      <div className="glass grid grid-cols-2 gap-2.5 rounded-3xl p-5 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
