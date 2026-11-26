import { messages } from '../i18n'
import { getLocale, type Locale } from '../i18n/locale'
import type { TemplateExercise, WorkoutTemplate } from '../types/models'
import { getExercise } from './exercises'

type BuiltInId = keyof ReturnType<typeof messages>['tracker']['builtInTemplates']

/** Ready-made days: a push/pull/legs split, an arm day and one full-body day with push and pull. */
const BUILT_IN: { id: BuiltInId; exerciseIds: string[] }[] = [
  {
    id: 'builtin-push',
    exerciseIds: ['wide-grip-bench-press', 'military-press', 'butterflies', 'lateral-raises', 'close-grip-bench-press', 'overhead-triceps-extension'],
  },
  { id: 'builtin-pull', exerciseIds: ['bent-over-row', 'one-arm-dumbbell-row', 'reverse-flys', 'bicep-curls', 'hammer-curls'] },
  { id: 'builtin-legs-core', exerciseIds: ['squats', 'romanian-deadlift', 'lunges', 'calf-raises', 'crunches', 'russian-twists'] },
  {
    id: 'builtin-arms-shoulders',
    exerciseIds: ['bicep-curls', 'hammer-curls', 'close-grip-bench-press', 'overhead-triceps-extension', 'lateral-raises', 'front-raises'],
  },
  { id: 'builtin-full-body', exerciseIds: ['squats', 'wide-grip-bench-press', 'bent-over-row', 'military-press', 'crunches'] },
]

/** Catalog defaults (sets × reps) for each exercise; weights stay open. */
function fromCatalog(id: BuiltInId, exerciseIds: string[], locale: Locale): WorkoutTemplate {
  const exercises: TemplateExercise[] = exerciseIds.flatMap((exerciseId) => {
    const exercise = getExercise(exerciseId, locale)
    if (!exercise) return []
    return [{ exerciseId, sets: Array.from({ length: exercise.defaultSets }, () => ({ reps: exercise.defaultReps, weightKg: null })) }]
  })
  return { id, name: messages(locale).tracker.builtInTemplates[id], exercises, createdAt: 0, builtIn: true }
}

const cache = new Map<Locale, WorkoutTemplate[]>()

/** The templates that ship with the app, named in the current language. */
export function builtInTemplates(locale: Locale = getLocale()): WorkoutTemplate[] {
  let templates = cache.get(locale)
  if (!templates) {
    templates = BUILT_IN.map(({ id, exerciseIds }) => fromCatalog(id, exerciseIds, locale))
    cache.set(locale, templates)
  }
  return templates
}
