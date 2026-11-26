import type { BodyRegion } from '../../data/muscleGroups'
import type { Difficulty, Equipment, ExerciseCategory, MuscleGroup } from '../../types/models'
import { define } from '../define'

/** Names of the catalog's building blocks; the exercises' own texts live in `data/exercises*.ts`. */
export const catalog = define(
  {
    muscles: {
      chest: 'Brust',
      back: 'Rücken',
      shoulders: 'Schultern',
      biceps: 'Bizeps',
      triceps: 'Trizeps',
      forearms: 'Unterarme',
      core: 'Bauch',
      obliques: 'Seitl. Bauch',
      quads: 'Beine vorn',
      hamstrings: 'Beine hinten',
      glutes: 'Gesäß',
      calves: 'Waden',
    } satisfies Record<MuscleGroup, string> as Record<MuscleGroup, string>,
    regions: { push: 'Drücken', pull: 'Ziehen', core: 'Rumpf', legs: 'Beine' } satisfies Record<BodyRegion, string> as Record<
      BodyRegion,
      string
    >,
    equipment: {
      barbell: 'Langhantel',
      dumbbell: 'Kurzhantel',
      machine: 'Maschine',
      cable: 'Kabelzug',
      bodyweight: 'Körpergewicht',
      kettlebell: 'Kettlebell',
      band: 'Band',
      other: 'Sonstiges',
    } satisfies Record<Equipment, string> as Record<Equipment, string>,
    categories: { strength: 'Kraft', core: 'Core', cardio: 'Cardio', mobility: 'Mobility' } satisfies Record<ExerciseCategory, string> as Record<
      ExerciseCategory,
      string
    >,
    difficulty: { beginner: 'Einsteiger', intermediate: 'Fortgeschritten', advanced: 'Profi' } satisfies Record<Difficulty, string> as Record<
      Difficulty,
      string
    >,
    breathingRule: 'Grundregel: bei der Anstrengung ausatmen, beim Nachgeben einatmen. Die Luft nicht anhalten.',
  },
  {
    muscles: {
      chest: 'Chest',
      back: 'Back',
      shoulders: 'Shoulders',
      biceps: 'Biceps',
      triceps: 'Triceps',
      forearms: 'Forearms',
      core: 'Abs',
      obliques: 'Obliques',
      quads: 'Quads',
      hamstrings: 'Hamstrings',
      glutes: 'Glutes',
      calves: 'Calves',
    },
    regions: { push: 'Push', pull: 'Pull', core: 'Core', legs: 'Legs' },
    equipment: {
      barbell: 'Barbell',
      dumbbell: 'Dumbbell',
      machine: 'Machine',
      cable: 'Cable',
      bodyweight: 'Bodyweight',
      kettlebell: 'Kettlebell',
      band: 'Band',
      other: 'Other',
    },
    categories: { strength: 'Strength', core: 'Core', cardio: 'Cardio', mobility: 'Mobility' },
    difficulty: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
    breathingRule: 'The basic rule: breathe out on the effort, breathe in as you release. Don’t hold your breath.',
  },
)
