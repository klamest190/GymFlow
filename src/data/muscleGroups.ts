import type { Difficulty, Equipment, ExerciseCategory, MuscleGroup } from '../types/models'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
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
}

/** Tailwind classes for the small colored dot / chip per muscle group. */
export const MUSCLE_GROUP_TINTS: Record<MuscleGroup, string> = {
  chest: 'bg-rose-400',
  back: 'bg-sky-400',
  shoulders: 'bg-amber-400',
  biceps: 'bg-violet-400',
  triceps: 'bg-fuchsia-400',
  forearms: 'bg-purple-300',
  core: 'bg-emerald-400',
  obliques: 'bg-teal-400',
  quads: 'bg-orange-400',
  hamstrings: 'bg-red-400',
  glutes: 'bg-pink-400',
  calves: 'bg-yellow-300',
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  machine: 'Maschine',
  cable: 'Kabelzug',
  bodyweight: 'Körpergewicht',
  kettlebell: 'Kettlebell',
  band: 'Band',
  other: 'Sonstiges',
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Kraft',
  core: 'Core',
  cardio: 'Cardio',
  mobility: 'Mobility',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Einsteiger',
  intermediate: 'Fortgeschritten',
  advanced: 'Profi',
}
