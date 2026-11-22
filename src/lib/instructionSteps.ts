/**
 * An exercise's instructions as steps: one sentence each. The catalog writes them as running
 * text, but the movement is a sequence, so the screens number the sentences.
 */
export function instructionSteps(instructions: string): string[] {
  return instructions
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)
    .map((step) => step.trim())
    .filter(Boolean)
}
