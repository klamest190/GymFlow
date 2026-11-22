import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '../../data/muscleGroups'
import type { Difficulty } from '../../types/models'

const STEPS = [1, 2, 3] as const
/** Bar heights in px: rising like a stack of plates, so the scale reads without a legend. */
const HEIGHTS = { 1: 6, 2: 9, 3: 12 } as const

/**
 * Difficulty as three rising bars plus the level name. Graphite, not yellow: it describes the
 * exercise, it is neither an action nor progress. The text carries the meaning, the bars the glance.
 */
export function DifficultyMeter({ difficulty }: { difficulty: Difficulty }) {
  const level = DIFFICULTY_LEVELS[difficulty]
  const label = DIFFICULTY_LABELS[difficulty]
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap" role="img" aria-label={`Schwierigkeit: ${label}, Stufe ${level} von ${STEPS.length}`}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {STEPS.map((step) => (
          <span
            key={step}
            style={{ height: HEIGHTS[step] }}
            className={`w-[3px] rounded-[1px] ${step <= level ? 'bg-fg' : 'bg-fg/15'}`}
          />
        ))}
      </span>
      <span className="text-[13px] font-medium text-muted" aria-hidden>
        {label}
      </span>
    </span>
  )
}
