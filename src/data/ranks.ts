import { Award, Crown, Gem, Medal, Shield, Trophy, type LucideIcon } from 'lucide-react'
import type { RankId } from '../types/models'

export interface RankDefinition {
  id: RankId
  label: string
  /** First level of this rank; the rank lasts until the next rank's `minLevel`. */
  minLevel: number
  icon: LucideIcon
  /** Badge fill. */
  gradient: string
  /** Icon and text color on the gradient. */
  ink: string
  /** Soft colored shadow under the badge. */
  glow: string
}

/** Ascending by `minLevel`; the first entry must start at level 1. */
export const RANKS: RankDefinition[] = [
  { id: 'iron', label: 'Eisen', minLevel: 1, icon: Shield, gradient: 'linear-gradient(135deg, #8b919a, #4b5058)', ink: '#ffffff', glow: 'rgb(107 114 128 / 0.45)' },
  { id: 'bronze', label: 'Bronze', minLevel: 10, icon: Medal, gradient: 'linear-gradient(135deg, #e3a06a, #9a5523)', ink: '#ffffff', glow: 'rgb(205 127 50 / 0.5)' },
  { id: 'silver', label: 'Silber', minLevel: 20, icon: Medal, gradient: 'linear-gradient(135deg, #f4f5f7, #a3a9b3)', ink: '#1f2329', glow: 'rgb(170 178 189 / 0.55)' },
  { id: 'gold', label: 'Gold', minLevel: 40, icon: Award, gradient: 'linear-gradient(135deg, #ffe58a, #d49a0c)', ink: '#2b1d00', glow: 'rgb(234 179 8 / 0.5)' },
  { id: 'platinum', label: 'Platin', minLevel: 60, icon: Trophy, gradient: 'linear-gradient(135deg, #e3fbf6, #6fc3b8)', ink: '#05332d', glow: 'rgb(94 234 212 / 0.45)' },
  { id: 'diamond', label: 'Diamant', minLevel: 80, icon: Gem, gradient: 'linear-gradient(135deg, #b9f2ff, #3b82f6)', ink: '#04204a', glow: 'rgb(59 130 246 / 0.5)' },
  { id: 'grandmaster', label: 'Grandmaster', minLevel: 100, icon: Crown, gradient: 'linear-gradient(135deg, #c6ff3d, #7c3aed)', ink: '#ffffff', glow: 'rgb(198 255 61 / 0.55)' },
]

export const RANK_BY_ID = Object.fromEntries(RANKS.map((rank) => [rank.id, rank])) as Record<RankId, RankDefinition>
