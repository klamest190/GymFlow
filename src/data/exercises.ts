import type { Exercise } from '../types/models'

/**
 * The fixed GymFlow exercise catalog. Users cannot add or edit exercises, so the muscle
 * mapping below is the single source of truth for all analytics.
 *
 * Adding an exercise: append a definition with a new, unique slug ID.
 * Never change or reuse an existing ID: logged workouts reference it.
 */
type ExerciseDefinition = Omit<Exercise, 'searchTerms'> & {
  /** Extra search keywords (synonyms, English names, common misspellings). */
  aliases: string[]
}

const DEFINITIONS: ExerciseDefinition[] = [
  {
    id: 'wide-grip-bench-press',
    name: 'Weites Brustdrücken',
    aliases: ['bankdrücken weit', 'wide grip bench press', 'bench press', 'brustrücken'],
    description: 'Bankdrücken mit weitem Griff – Fokus auf die gesamte Brustmuskulatur.',
    instructions:
      'Flach auf die Bank legen, Füße fest im Boden, Schulterblätter zusammen- und nach unten ziehen. ' +
      'Die Stange etwa 1,5-fach schulterbreit greifen. Kontrolliert zur unteren Brust absenken, ' +
      'die Ellbogen dabei rund 45–60° vom Körper entfernt halten. Kurz ohne Abfedern berühren und ' +
      'kraftvoll nach oben drücken, bis die Arme fast gestreckt sind.',
    formCues: ['Schulterblätter bleiben fixiert', 'Leichtes Hohlkreuz, Gesäß auf der Bank', 'Ellbogen nicht 90° abspreizen'],
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    category: 'strength',
    equipment: 'barbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 4,
    defaultReps: 10,
  },
  {
    id: 'butterflies',
    name: 'Butterflies',
    aliases: ['butterfly', 'flys', 'fliegende', 'chest fly', 'pec deck'],
    description: 'Isolationsübung für die Brust mit großem Bewegungsradius.',
    instructions:
      'An der Maschine oder mit Kurzhanteln auf der Flachbank: Arme leicht gebeugt vor der Brust. ' +
      'In einem weiten Bogen öffnen, bis eine deutliche Dehnung in der Brust spürbar ist, der ' +
      'Ellbogenwinkel bleibt dabei konstant. Anschließend die Arme mit bewusster Brustspannung ' +
      'wieder zusammenführen, als würdest du einen großen Baum umarmen.',
    formCues: ['Ellbogenwinkel nicht verändern', 'Langsame, kontrollierte Dehnung', 'Schultern tief halten'],
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'close-grip-bench-press',
    name: 'Enges Brustdrücken',
    aliases: ['bankdrücken eng', 'close grip bench press', 'enges bankdrücken', 'brustrücken'],
    description: 'Bankdrücken mit engem Griff – verlagert den Fokus auf Trizeps und innere Brust.',
    instructions:
      'Die Stange etwa schulterbreit greifen, Handgelenke gerade über den Ellbogen. Die Stange ' +
      'zur unteren Brust absenken und die Ellbogen dabei eng am Oberkörper führen. Aus dem ' +
      'Trizeps heraus nach oben drücken, ohne die Ellbogen nach außen klappen zu lassen.',
    formCues: ['Griff nicht enger als schulterbreit', 'Ellbogen eng am Körper', 'Handgelenke stabil und neutral'],
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    category: 'strength',
    equipment: 'barbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'bicep-curls',
    name: 'Bizeps Curls',
    aliases: ['bicep curls', 'bizepscurls', 'curls', 'hantelcurls'],
    description: 'Klassische Isolationsübung für einen kräftigen Bizeps.',
    instructions:
      'Aufrecht stehen, Kurzhanteln mit Untergriff seitlich am Körper. Die Oberarme bleiben fest ' +
      'an den Rumpf gepresst, während du die Gewichte durch Beugen im Ellbogen bis auf Schulterhöhe ' +
      'curlst. Oben kurz den Bizeps anspannen und langsam, über zwei bis drei Sekunden, absenken.',
    formCues: ['Kein Schwung aus dem Rücken', 'Ellbogen bleiben am Körper', 'Unten vollständig strecken'],
    primaryMuscle: 'biceps',
    secondaryMuscles: ['forearms'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'lateral-raises',
    name: 'Seitheben',
    aliases: ['lateral raise', 'seitheben kurzhantel', 'side raises'],
    description: 'Gezielte Übung für die seitliche Schulter – sorgt für breite Schultern.',
    instructions:
      'Schulterbreit stehen, Kurzhanteln vor dem Körper, Arme minimal gebeugt. Die Gewichte seitlich ' +
      'bis knapp auf Schulterhöhe anheben und dabei mit den Ellbogen führen, nicht mit den Händen. ' +
      'Kurz halten und kontrolliert absenken, ohne die Spannung unten komplett abzugeben.',
    formCues: ['Nicht über Schulterhöhe heben', 'Nacken entspannt, Schultern tief', 'Leichtes Gewicht, saubere Technik'],
    primaryMuscle: 'shoulders',
    secondaryMuscles: [],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    id: 'front-raises',
    name: 'Frontheben',
    aliases: ['front raise', 'frontheben kurzhantel'],
    description: 'Isolationsübung für die vordere Schulter.',
    instructions:
      'Aufrecht stehen, Kurzhanteln im Obergriff vor den Oberschenkeln. Mit leicht gebeugten Armen ' +
      'abwechselnd oder gleichzeitig nach vorne bis auf Augenhöhe heben. Den Oberkörper ruhig halten ' +
      'und die Bewegung langsam zurückführen.',
    formCues: ['Rumpf stabil, kein Zurücklehnen', 'Maximal bis Augenhöhe', 'Kontrollierte Abwärtsphase'],
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['chest'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'squats',
    name: 'Squats (Kniebeugen)',
    aliases: ['squat', 'kniebeuge', 'kniebeugen', 'back squat'],
    description: 'Die Königsübung für Beine und Gesäß.',
    instructions:
      'Etwa schulterbreit stehen, Fußspitzen leicht nach außen. Brust aufrichten, Rumpf fest anspannen ' +
      'und die Hüfte nach hinten unten absenken, als würdest du dich auf einen Stuhl setzen. Die Knie ' +
      'folgen der Richtung der Fußspitzen. Mindestens bis die Oberschenkel parallel zum Boden sind, ' +
      'dann über die ganze Fußsohle kraftvoll nach oben drücken.',
    formCues: ['Knie nicht nach innen fallen lassen', 'Fersen bleiben am Boden', 'Neutraler Rücken, Blick nach vorn'],
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    category: 'strength',
    equipment: 'barbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 4,
    defaultReps: 8,
  },
  {
    id: 'lunges',
    name: 'Lunges (Ausfallschritte)',
    aliases: ['lunge', 'ausfallschritt', 'ausfallschritte', 'walking lunges'],
    description: 'Einbeinige Übung für Beine, Gesäß und Stabilität.',
    instructions:
      'Aufrecht stehen und einen großen Schritt nach vorne machen. Beide Knie beugen, bis das hintere ' +
      'Knie knapp über dem Boden schwebt und beide Kniegelenke etwa 90° bilden. Das vordere Knie ' +
      'bleibt über dem Fußgelenk. Über die Ferse des vorderen Beins zurück in den Stand drücken und ' +
      'die Seite wechseln.',
    formCues: ['Oberkörper aufrecht', 'Vorderes Knie stabil über dem Fuß', 'Schritt lang genug wählen'],
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    usesWeight: false,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'crunches',
    name: 'Crunches',
    aliases: ['crunch', 'bauchpresse', 'sit ups'],
    description: 'Grundübung für die gerade Bauchmuskulatur.',
    instructions:
      'Auf den Rücken legen, Knie angewinkelt, Füße flach am Boden. Hände leicht an die Schläfen legen ' +
      'oder vor der Brust kreuzen. Mit dem Ausatmen den oberen Rücken Wirbel für Wirbel einrollen, bis ' +
      'die Schulterblätter vom Boden abheben. Kurz halten und langsam wieder ablegen.',
    formCues: ['Nicht am Nacken ziehen', 'Unterer Rücken bleibt am Boden', 'Beim Hochkommen ausatmen'],
    primaryMuscle: 'core',
    secondaryMuscles: [],
    category: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    usesWeight: false,
    defaultSets: 3,
    defaultReps: 20,
  },
  {
    id: 'russian-twists',
    name: 'Russian Twists',
    aliases: ['russian twist', 'rumpfdrehen'],
    description: 'Rotationsübung für die seitliche Bauchmuskulatur.',
    instructions:
      'Auf den Boden setzen, Knie gebeugt, Oberkörper mit geradem Rücken etwa 45° zurücklehnen. ' +
      'Für mehr Intensität die Füße vom Boden abheben. Den Oberkörper kontrolliert von Seite zu Seite ' +
      'rotieren und die Hände bzw. das Gewicht jeweils neben die Hüfte führen. Eine Seite plus die ' +
      'andere zählt als eine Wiederholung.',
    formCues: ['Rotation aus dem Rumpf, nicht nur den Armen', 'Rücken bleibt gerade', 'Gleichmäßig atmen'],
    primaryMuscle: 'obliques',
    secondaryMuscles: ['core'],
    category: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    usesWeight: false,
    defaultSets: 3,
    defaultReps: 20,
  },
  {
    id: 'military-press',
    name: 'Military Press (Schulterdrücken)',
    aliases: ['shoulder press', 'overhead press', 'ohp', 'schulterdrücken', 'military press'],
    description: 'Freie Drückübung über Kopf für kräftige Schultern und einen stabilen Rumpf.',
    instructions:
      'Stehend, Füße hüftbreit, die Stange etwas breiter als schulterbreit auf Höhe der oberen Brust. ' +
      'Gesäß und Bauch fest anspannen. Die Stange senkrecht nach oben drücken und den Kopf kurz ' +
      'zurücknehmen, damit sie eng am Gesicht vorbeiläuft. Oben die Arme strecken, den Kopf ' +
      '„durchs Fenster“ schieben und die Stange kontrolliert zurück zur Brust führen.',
    formCues: ['Kein Hohlkreuz – Rumpf fest', 'Stange auf gerader Linie führen', 'Handgelenke über den Ellbogen'],
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'core'],
    category: 'strength',
    equipment: 'barbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 4,
    defaultReps: 8,
  },
]

const buildSearchTerms = (name: string, aliases: string[]) =>
  [...new Set([name, ...aliases].map((term) => term.toLowerCase().trim()).filter(Boolean))]

/** All exercises, sorted by name. */
export const EXERCISES: Exercise[] = DEFINITIONS.map(({ aliases, ...definition }) => ({
  ...definition,
  searchTerms: buildSearchTerms(definition.name, aliases),
})).sort((a, b) => a.name.localeCompare(b.name, 'de'))

const EXERCISES_BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))

/** Looks up a catalog exercise; `undefined` only for IDs that were removed from the catalog. */
export const getExercise = (id: string) => EXERCISES_BY_ID.get(id)
