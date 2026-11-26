import { RANK_BY_ID, type RankDefinition } from '../../data/ranks'
import { useT } from '../../i18n'
import type { GamificationState } from '../../types/models'

/** Rank name on the rank's gradient ("Eisen", "Gold", …). */
export function RankBadge({ rank }: { rank: RankDefinition }) {
  const t = useT()
  const Icon = rank.icon
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: rank.gradient, color: rank.ink }}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {t.gamification.ranks[rank.id]}
    </span>
  )
}

/** Compact level chip in the rank's colors ("Lv 12"), e.g. for user lists. */
export function LevelBadge({ gamification }: { gamification: GamificationState | null }) {
  const t = useT()
  if (!gamification) {
    return (
      <span className="inline-flex rounded-full bg-sunken px-2.5 py-1 text-[12px] font-semibold text-muted" title={t.gamification.noData}>
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
      title={t.gamification.rankAndLevel(t.gamification.ranks[rank.id], gamification.level)}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {t.gamification.levelShort(gamification.level)}
    </span>
  )
}
