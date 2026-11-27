import { describe, expect, it } from 'vitest'
import { CATALOG_ORDER, getExercise } from './exercises'
import { builtInTemplates } from './templates'

const BUILT_IN_TEMPLATES = builtInTemplates('de')

// Template definitions name exercises by ID and silently skip unknown ones, so a typo would
// quietly drop an exercise from a day.
const DEFINED: Record<string, number> = {
  'builtin-push': 6,
  'builtin-pull': 5,
  'builtin-legs-core': 6,
  'builtin-arms-shoulders': 6,
  'builtin-full-body': 5,
  'builtin-advanced': 5,
  'builtin-bodyweight': 4,
}

it('gives every exercise of the catalog a place in a template', () => {
  const used = new Set(BUILT_IN_TEMPLATES.flatMap((template) => template.exercises.map(({ exerciseId }) => exerciseId)))
  expect(CATALOG_ORDER.filter((id) => !used.has(id))).toEqual([])
})

describe('built-in templates', () => {
  it.each(BUILT_IN_TEMPLATES.map((template) => [template.id, template] as const))('%s keeps every exercise it names', (id, template) => {
    expect(template.exercises).toHaveLength(DEFINED[id])
    for (const { exerciseId } of template.exercises) expect(getExercise(exerciseId)).toBeDefined()
  })

  it('has unique IDs', () => {
    expect(new Set(BUILT_IN_TEMPLATES.map((template) => template.id)).size).toBe(BUILT_IN_TEMPLATES.length)
  })
})

it('names the built-in templates in both languages', () => {
  expect(builtInTemplates('de').map((template) => template.name)).toContain('Ganzkörper')
  expect(builtInTemplates('en').map((template) => template.name)).toContain('Full body')
})
