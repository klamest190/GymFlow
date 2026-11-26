import type { Metric } from '../../lib/stats'
import { define } from '../define'

type MetricTexts = Record<Metric, string>

export const stats = define(
  {
    metrics: { reps: 'Wiederholungen', sets: 'Sätze', volumeKg: 'Volumen (kg)' } satisfies MetricTexts as MetricTexts,
    metricsShort: { reps: 'Wdh.', sets: 'Sätze', volumeKg: 'Volumen' } satisfies MetricTexts as MetricTexts,
    /** Without the unit, for tooltips that add their own. */
    metricsPlain: { reps: 'Wiederholungen', sets: 'Sätze', volumeKg: 'Volumen' } satisfies MetricTexts as MetricTexts,

    title: 'Statistik',
    period: 'Die letzten 12 Monate',
    metric: 'Kennzahl',
    loading: 'Statistik wird geladen',

    // KPI tiles
    thisWeek: 'Diese Woche',
    goalReached: 'Wochenziel erreicht',
    trainingDays: 'Trainingstage',
    weeklyGoal: 'Wochenziel',
    weekStreak: (weeks: number) => `${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'} in Folge`,
    previousWeek: (window: string, value: string) => `Vorwoche (${window}): ${value}`,
    noPreviousWeek: 'Vorwoche: –',
    vsPreviousWeek: ' zur Vorwoche',

    // Weekly chart
    perWeek: (metric: string) => `${metric} pro Woche`,
    lastWeeks: (weeks: number) => `Die letzten ${weeks} Wochen. Die laufende Woche ist heller, weil sie noch nicht vorbei ist.`,
    noTrainingInWeeks: (weeks: number) => `Noch keine Trainings in den letzten ${weeks} Wochen.`,
    stillRunning: ', läuft noch',
    vsWeekBefore: ' vs. Vorwoche',

    // Muscle distribution
    muscleGroups: 'Muskelgruppen',
    setsHalfSecondary: 'Sätze pro Muskelgruppe, Hilfsmuskeln zählen halb',
    setsPrimaryOnly: 'Sätze pro Muskelgruppe, nur der Hauptmuskel',
    range: 'Zeitraum',
    noTrainingInDays: (days: string) => `Keine Trainings in den letzten ${days} Tagen.`,
    muscles: 'Muskeln',
    primaryOnly: 'Nur Hauptmuskel',
    withSecondary: 'Inkl. Hilfsmuskeln',
    days: (days: string) => `${days} T`,

    // Heatmap
    activity: 'Aktivität',
    activitySubtitle: (days: number, months: number, metric: string) =>
      `${days} ${days === 1 ? 'Trainingstag' : 'Trainingstage'} in den letzten ${months} Monaten, eingefärbt nach ${metric}`,
    noTraining: 'kein Training',
    tapForDetails: 'Tag antippen oder überfahren für Details',
    less: 'Weniger',
    more: 'Mehr',

    // Exercise progress
    sessions: (sessions: number) => `${sessions} ${sessions === 1 ? 'Training' : 'Trainings'}`,
    progressPerExercise: 'Fortschritt pro Übung',
    heaviestSetPerSession: 'Schwerster Satz pro Training',
    repsPerSession: 'Wiederholungen pro Training',
    pickExercise: 'Übung auswählen',
    progressEmpty: 'Sobald du trainierst, siehst du hier deinen Verlauf.',
    lastSession: (when: string) => `Letztes Training: ${when}`,
    firstSession: (value: string) => `Erstes Training im Zeitraum: ${value}`,
    sinceStart: ' seit Start',
    history: (exercise: string) => `Verlauf ${exercise}`,
    heaviestSet: 'Schwerster Satz',
    reps: 'Wiederholungen',
    totalReps: 'Wdh. gesamt',
    records: 'Bestleistungen',
    recordsPeriod: 'Letzte 12 Monate',
    noRecords: 'Noch keine Bestleistungen.',
  },
  {
    metrics: { reps: 'Reps', sets: 'Sets', volumeKg: 'Volume (kg)' },
    metricsShort: { reps: 'Reps', sets: 'Sets', volumeKg: 'Volume' },
    metricsPlain: { reps: 'Reps', sets: 'Sets', volumeKg: 'Volume' },

    title: 'Stats',
    period: 'The last 12 months',
    metric: 'Metric',
    loading: 'Loading stats',

    thisWeek: 'This week',
    goalReached: 'Weekly goal reached',
    trainingDays: 'Training days',
    weeklyGoal: 'Weekly goal',
    weekStreak: (weeks: number) => `${weeks} ${weeks === 1 ? 'week' : 'weeks'} in a row`,
    previousWeek: (window: string, value: string) => `Last week (${window}): ${value}`,
    noPreviousWeek: 'Last week: –',
    vsPreviousWeek: ' vs. last week',

    perWeek: (metric: string) => `${metric} per week`,
    lastWeeks: (weeks: number) => `The last ${weeks} weeks. The current week is lighter because it isn’t over yet.`,
    noTrainingInWeeks: (weeks: number) => `No training in the last ${weeks} weeks yet.`,
    stillRunning: ', still running',
    vsWeekBefore: ' vs. the week before',

    muscleGroups: 'Muscle groups',
    setsHalfSecondary: 'Sets per muscle group, supporting muscles count half',
    setsPrimaryOnly: 'Sets per muscle group, primary muscle only',
    range: 'Period',
    noTrainingInDays: (days: string) => `No training in the last ${days} days.`,
    muscles: 'Muscles',
    primaryOnly: 'Primary only',
    withSecondary: 'Incl. supporting',
    days: (days: string) => `${days} d`,

    activity: 'Activity',
    activitySubtitle: (days: number, months: number, metric: string) =>
      `${days} ${days === 1 ? 'training day' : 'training days'} in the last ${months} months, shaded by ${metric.toLowerCase()}`,
    noTraining: 'no training',
    tapForDetails: 'Tap or hover over a day for details',
    less: 'Less',
    more: 'More',

    sessions: (sessions: number) => `${sessions} ${sessions === 1 ? 'session' : 'sessions'}`,
    progressPerExercise: 'Progress per exercise',
    heaviestSetPerSession: 'Heaviest set per session',
    repsPerSession: 'Reps per session',
    pickExercise: 'Pick an exercise',
    progressEmpty: 'Once you train, you’ll see your progress here.',
    lastSession: (when: string) => `Last session: ${when}`,
    firstSession: (value: string) => `First session in this period: ${value}`,
    sinceStart: ' since the start',
    history: (exercise: string) => `History ${exercise}`,
    heaviestSet: 'Heaviest set',
    reps: 'Reps',
    totalReps: 'Total reps',
    records: 'Personal bests',
    recordsPeriod: 'Last 12 months',
    noRecords: 'No personal bests yet.',
  },
)
