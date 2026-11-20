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

/** Ready-made days: a push/pull/legs split, an arm day and one full-body day with push and pull. */
export const BUILT_IN_TEMPLATES: WorkoutTemplate[] = [
  fromCatalog('builtin-push', 'Push: Brust, Schultern, Trizeps', [
    'wide-grip-bench-press',
    'military-press',
    'butterflies',
    'lateral-raises',
    'close-grip-bench-press',
    'overhead-triceps-extension',
  ]),
  fromCatalog('builtin-pull', 'Pull: Rücken, Bizeps', ['bent-over-row', 'one-arm-dumbbell-row', 'reverse-flys', 'bicep-curls', 'hammer-curls']),
  fromCatalog('builtin-legs-core', 'Beine & Core', ['squats', 'romanian-deadlift', 'lunges', 'calf-raises', 'crunches', 'russian-twists']),
  fromCatalog('builtin-arms-shoulders', 'Arme & Schultern', [
    'bicep-curls',
    'hammer-curls',
    'close-grip-bench-press',
    'overhead-triceps-extension',
    'lateral-raises',
    'front-raises',
  ]),
  fromCatalog('builtin-full-body', 'Ganzkörper', ['squats', 'wide-grip-bench-press', 'bent-over-row', 'military-press', 'crunches']),
]
