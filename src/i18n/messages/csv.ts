import { define } from '../define'

/** Column headers and values of the CSV export. */
export const csv = define(
  {
    workoutHeader: ['Datum', 'Übung', 'Muskelgruppe', 'Satz', 'Wiederholungen', 'Gewicht (kg)', 'Gewicht gilt', 'Volumen (kg)'],
    bodyWeightHeader: ['Datum', 'Körpergewicht (kg)'],
    perDumbbell: 'je Hantel',
    total: 'gesamt',
  },
  {
    workoutHeader: ['Date', 'Exercise', 'Muscle group', 'Set', 'Reps', 'Weight (kg)', 'Weight is', 'Volume (kg)'],
    bodyWeightHeader: ['Date', 'Body weight (kg)'],
    perDumbbell: 'per dumbbell',
    total: 'total',
  },
)
