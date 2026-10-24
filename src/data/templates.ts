import type { TemplateExercise, WorkoutTemplate } from '../types/models'
import { getExercise } from './exercises'

/** Catalog defaults (sets × reps) for each exercise; weights stay open. */
function fromCatalog(id: string, name: string, exerciseIds: string[]): WorkoutTemplate {
  const exercises: TemplateExercise[] = exerciseIds.flatMap((exerciseId) => {
    const exercise = getExercise(exerciseId)
    if (!exercise) return []
    return [{ exerciseId, sets: Array.from({ length: exercise.defaultSets }, () => ({ reps: exercise.defaultReps, weightKg: null })) }]
  })
  return { id, name, exercises, createdAt: 0, builtIn: true }
}

/**
 * Ready-made days. There is no pure back exercise in the catalog yet, so a "Pull" day would be
 * misleading; it can be added once rows/pull-ups exist.
 */
export const BUILT_IN_TEMPLATES: WorkoutTemplate[] = [
  fromCatalog('builtin-push', 'Push: Brust, Schultern, Trizeps', ['wide-grip-bench-press', 'military-press', 'butterflies', 'lateral-raises', 'close-grip-bench-press']),
  fromCatalog('builtin-legs-core', 'Beine & Core', ['squats', 'lunges', 'crunches', 'russian-twists']),
  fromCatalog('builtin-arms-shoulders', 'Arme & Schultern', ['bicep-curls', 'close-grip-bench-press', 'lateral-raises', 'front-raises']),
  fromCatalog('builtin-full-body', 'Ganzkörper', ['squats', 'wide-grip-bench-press', 'military-press', 'bicep-curls', 'crunches']),
]
