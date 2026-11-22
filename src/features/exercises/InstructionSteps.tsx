import { instructionSteps } from '../../lib/instructionSteps'

/** The instructions as numbered steps, for reading between sets at a glance. */
export function InstructionSteps({ instructions, className = '' }: { instructions: string; className?: string }) {
  return (
    <ol className={`space-y-2 ${className}`}>
      {instructionSteps(instructions).map((step, index) => (
        <li key={step} className="flex gap-3">
          <span className="numeral w-4 shrink-0 text-right text-[17px] leading-[1.45] text-muted" aria-hidden>
            {index + 1}
          </span>
          <span className="min-w-0">{step}</span>
        </li>
      ))}
    </ol>
  )
}
