import { RANK_BY_ID, type RankDefinition } from '../../data/ranks'
import type { GamificationState } from '../../types/models'

/** Rank name on the rank's gradient ("Eisen", "Gold", …). */
export function RankBadge({ rank }: { rank: RankDefinition }) {
  const Icon = rank.icon
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: rank.gradient, color: rank.ink }}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {rank.label}
    </span>
  )
}

/** Compact level chip in the rank's colors ("Lv 12"), e.g. for user lists. */
export function LevelBadge({ gamification }: { gamification: GamificationState | null }) {
  if (!gamification) {
    return (
      <span className="inline-flex rounded-full bg-sunken px-2.5 py-1 text-[12px] font-semibold text-muted" title="Noch keine Trainingsdaten synchronisiert">
        –
      </span>
    )
  }
  const rank = RANK_BY_ID[gamification.rank]
  const Icon = rank.icon
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums"
      style={{ background: rank.gradient, color: rank.ink }}
      title={`${rank.label} · Level ${gamification.level}`}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      Lv {gamification.level}
    </span>
  )
}
