import { describe, expect, it } from 'vitest'
import { getExercise } from './exercises'
import { BUILT_IN_TEMPLATES } from './templates'

// Template definitions name exercises by ID and silently skip unknown ones, so a typo would
// quietly drop an exercise from a day.
const DEFINED: Record<string, number> = {
  'builtin-push': 6,
  'builtin-pull': 5,
  'builtin-legs-core': 6,
  'builtin-arms-shoulders': 6,
  'builtin-full-body': 5,
}

describe('built-in templates', () => {
  it.each(BUILT_IN_TEMPLATES.map((template) => [template.id, template] as const))('%s keeps every exercise it names', (id, template) => {
    expect(template.exercises).toHaveLength(DEFINED[id])
    for (const { exerciseId } of template.exercises) expect(getExercise(exerciseId)).toBeDefined()
  })

  it('has unique IDs', () => {
    expect(new Set(BUILT_IN_TEMPLATES.map((template) => template.id)).size).toBe(BUILT_IN_TEMPLATES.length)
  })
})
