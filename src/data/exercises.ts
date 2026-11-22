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
    aliases: ['bankdrücken weit', 'wide grip bench press', 'bench press', 'brustrücken', 'kurzhantel bankdrücken', 'dumbbell bench press'],
    description: 'Bankdrücken mit zwei Kurzhanteln und weit geführten Armen – Fokus auf die gesamte Brustmuskulatur.',
    instructions:
      'Flach auf die Bank legen, Füße fest im Boden, Schulterblätter zusammen- und nach unten ziehen. ' +
      'Je eine Kurzhantel im Obergriff über der Brust halten, etwa 1,5-fach schulterbreit. Kontrolliert ' +
      'seitlich neben die untere Brust absenken, die Ellbogen dabei rund 45–60° vom Körper entfernt halten. ' +
      'Unten kurz halten und kraftvoll nach oben drücken, bis die Arme fast gestreckt sind.',
    formCues: ['Schulterblätter bleiben fixiert', 'Leichtes Hohlkreuz, Gesäß auf der Bank', 'Ellbogen nicht 90° abspreizen'],
    breathing: 'Beim Absenken der Hanteln einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 4,
    defaultReps: 10,
  },
  {
    id: 'butterflies',
    name: 'Butterflies',
    aliases: ['butterfly', 'flys', 'fliegende', 'chest fly', 'pec deck'],
    description: 'Isolationsübung für die Brust mit großem Bewegungsradius.',
    instructions:
      'Mit je einer Kurzhantel auf der Flachbank liegen, die Arme leicht gebeugt vor der Brust. ' +
      'In einem weiten Bogen öffnen, bis eine deutliche Dehnung in der Brust spürbar ist, der ' +
      'Ellbogenwinkel bleibt dabei konstant. Anschließend die Arme mit bewusster Brustspannung ' +
      'wieder zusammenführen, als würdest du einen großen Baum umarmen.',
    formCues: ['Ellbogenwinkel nicht verändern', 'Langsame, kontrollierte Dehnung', 'Schultern tief halten'],
    breathing: 'Beim Öffnen der Arme einatmen, beim Zusammenführen ausatmen.',
    primaryMuscle: 'chest',
    secondaryMuscles: ['shoulders'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'close-grip-bench-press',
    name: 'Enges Brustdrücken',
    aliases: ['bankdrücken eng', 'close grip bench press', 'enges bankdrücken', 'brustrücken', 'kurzhantel eng'],
    description: 'Enges Drücken mit zwei Kurzhanteln – verlagert den Fokus auf Trizeps und innere Brust.',
    instructions:
      'Auf der Flachbank zwei Kurzhanteln im Neutralgriff (Handflächen zueinander) eng nebeneinander ' +
      'über der Brust halten, Handgelenke gerade über den Ellbogen. Zur unteren Brust absenken und die ' +
      'Ellbogen dabei eng am Oberkörper führen. Aus dem Trizeps heraus nach oben drücken, ohne die ' +
      'Ellbogen nach außen klappen zu lassen.',
    formCues: ['Hanteln bleiben eng beieinander', 'Ellbogen eng am Körper', 'Handgelenke stabil und neutral'],
    breathing: 'Beim Absenken der Hanteln einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'bicep-curls',
    name: 'Bizeps Curls',
    aliases: ['bicep curls', 'bizepscurls', 'curls', 'hantelcurls'],
    description: 'Klassische Isolationsübung für einen kräftigen Bizeps.',
    instructions:
      'Aufrecht stehen, Kurzhanteln seitlich am Körper, die Handflächen zeigen zu den Oberschenkeln. ' +
      'Die Oberarme bleiben fest an den Rumpf gepresst, während du die Gewichte durch Beugen im ' +
      'Ellbogen bis auf Schulterhöhe curlst und dabei die Handgelenke nach außen drehst, bis die ' +
      'Handflächen oben zu den Schultern zeigen. Oben kurz den Bizeps anspannen und langsam, über ' +
      'zwei bis drei Sekunden, mit der Rückdrehung absenken.',
    formCues: ['Kein Schwung aus dem Rücken', 'Ellbogen bleiben am Körper', 'Unten vollständig strecken'],
    breathing: 'Beim Hochführen der Hanteln ausatmen, beim Ablassen einatmen.',
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
    breathing: 'Beim Anheben der Arme ausatmen, beim Senken einatmen.',
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
    breathing: 'Beim Anheben der Arme ausatmen, beim Senken einatmen.',
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
    aliases: ['squat', 'kniebeuge', 'kniebeugen', 'dumbbell squat', 'kurzhantel kniebeugen'],
    description: 'Die Königsübung für Beine und Gesäß.',
    instructions:
      'Etwa schulterbreit stehen, Fußspitzen leicht nach außen, die Kurzhanteln vorne auf den Schultern. ' +
      'Brust aufrichten, Rumpf fest anspannen und die Hüfte nach hinten unten absenken, als würdest du ' +
      'dich auf einen Stuhl setzen. Die Knie folgen der Richtung der Fußspitzen. Mindestens bis die Oberschenkel parallel zum Boden sind, ' +
      'dann über die ganze Fußsohle kraftvoll nach oben drücken.',
    formCues: ['Knie nicht nach innen fallen lassen', 'Fersen bleiben am Boden', 'Neutraler Rücken, Blick nach vorn'],
    breathing: 'Beim Absenken einatmen, beim Hochkommen ausatmen.',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 4,
    defaultReps: 8,
  },
  {
    id: 'lunges',
    name: 'Lunges (Ausfallschritte)',
    aliases: ['lunge', 'ausfallschritt', 'ausfallschritte', 'walking lunges'],
    description: 'Einbeinige Übung für Beine, Gesäß und Stabilität.',
    instructions:
      'Aufrecht stehen, die Kurzhanteln seitlich in den Händen, und einen großen Schritt nach vorne machen. ' +
      'Beide Knie beugen, bis das hintere Knie knapp über dem Boden schwebt und beide Kniegelenke ' +
      'etwa 90° bilden. Das vordere Knie bleibt über dem Fußgelenk. Über die Ferse des vorderen Beins zurück in den Stand drücken und ' +
      'die Seite wechseln.',
    formCues: ['Oberkörper aufrecht', 'Vorderes Knie stabil über dem Fuß', 'Schritt lang genug wählen'],
    breathing: 'Beim Absenken in den Ausfallschritt einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'crunches',
    name: 'Crunches',
    aliases: ['crunch', 'bauchpresse', 'sit ups'],
    description: 'Grundübung für die gerade Bauchmuskulatur.',
    instructions:
      'Auf den Rücken legen, Knie angewinkelt, Füße flach am Boden. Die Kurzhanteln aufrecht auf der ' +
      'Brust halten. Mit dem Ausatmen den oberen Rücken Wirbel für Wirbel einrollen, bis ' +
      'die Schulterblätter vom Boden abheben. Kurz halten und langsam wieder ablegen.',
    formCues: ['Hanteln fest an der Brust', 'Unterer Rücken bleibt am Boden', 'Beim Hochkommen ausatmen'],
    breathing: 'Beim Aufrollen ausatmen, beim Ablegen einatmen.',
    primaryMuscle: 'core',
    secondaryMuscles: [],
    category: 'core',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
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
      'rotieren und die Kurzhanteln jeweils neben die Hüfte führen. Eine Seite plus die ' +
      'andere zählt als eine Wiederholung.',
    formCues: ['Rotation aus dem Rumpf, nicht nur den Armen', 'Rücken bleibt gerade', 'Gleichmäßig atmen'],
    breathing: 'Gleichmäßig weiteratmen: bei jeder Drehung zur Seite ausatmen, in der Mitte einatmen.',
    primaryMuscle: 'obliques',
    secondaryMuscles: ['core'],
    category: 'core',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    noWave: true,
    defaultSets: 3,
    defaultReps: 20,
  },
  {
    id: 'military-press',
    name: 'Military Press (Schulterdrücken)',
    aliases: ['shoulder press', 'overhead press', 'ohp', 'schulterdrücken', 'military press'],
    description: 'Freie Drückübung über Kopf mit zwei Kurzhanteln für kräftige Schultern und einen stabilen Rumpf.',
    instructions:
      'Stehend, Füße hüftbreit, die Kurzhanteln im Obergriff seitlich auf Schulterhöhe. Gesäß und Bauch ' +
      'fest anspannen. Die Hanteln senkrecht nach oben drücken und oben leicht zusammenführen, bis die ' +
      'Arme gestreckt sind. Kontrolliert zurück auf Schulterhöhe absenken.',
    formCues: ['Kein Hohlkreuz – Rumpf fest', 'Hanteln auf gerader Linie führen', 'Handgelenke über den Ellbogen'],
    breathing: 'Beim Hochdrücken ausatmen, beim Absenken einatmen.',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'core'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 4,
    defaultReps: 8,
  },
  {
    id: 'one-arm-dumbbell-row',
    name: 'Einarmiges Rudern',
    aliases: ['one arm row', 'one arm dumbbell row', 'single arm row', 'kurzhantelrudern einarmig', 'rudern einarmig'],
    description: 'Rudern mit einer Hand, die andere abgestützt – für einen breiten, kräftigen Rücken.',
    instructions:
      'In Schrittstellung stehen, das vordere Knie gebeugt, und die freie Hand auf den vorderen ' +
      'Oberschenkel stützen. Den Oberkörper mit geradem Rücken weit nach vorne neigen, die Kurzhantel ' +
      'hängt im Neutralgriff unter der Schulter. Den Ellbogen nah am Körper nach hinten oben ziehen, bis ' +
      'die Hantel neben der Hüfte ist, oben das Schulterblatt zur Wirbelsäule ziehen. Kontrolliert ' +
      'absenken, bis der Arm gestreckt ist. Alle Wiederholungen auf einer Seite, dann wechseln.',
    formCues: ['Rücken gerade, Hüfte bleibt parallel zum Boden', 'Mit dem Ellbogen ziehen, nicht mit der Hand', 'Oberkörper nicht aufdrehen'],
    breathing: 'Beim Hochziehen ausatmen, beim Absenken einatmen.',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'bent-over-row',
    name: 'Vorgebeugtes Rudern',
    aliases: ['bent over row', 'dumbbell row', 'kurzhantelrudern', 'rudern vorgebeugt', 'langhantelrudern'],
    description: 'Beidarmiges Rudern im Vorbeugen für den ganzen oberen Rücken.',
    instructions:
      'Hüftbreit stehen, die Knie leicht beugen und den Oberkörper mit geradem Rücken etwa 45° nach ' +
      'vorne neigen, die Hüfte schiebt dabei nach hinten. Die Kurzhanteln hängen im Neutralgriff ' +
      'unter den Schultern. Beide Ellbogen nah am Körper nach hinten oben ziehen, bis die Hanteln neben ' +
      'der Hüfte sind, und die Schulterblätter zusammenziehen. Langsam absenken, ohne den Oberkörper ' +
      'aufzurichten.',
    formCues: ['Rücken bleibt gerade, kein Rundrücken', 'Oberkörperwinkel bleibt gleich', 'Schulterblätter oben zusammenziehen'],
    breathing: 'Beim Hochziehen ausatmen, beim Absenken einatmen.',
    primaryMuscle: 'back',
    secondaryMuscles: ['biceps', 'shoulders', 'hamstrings'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 4,
    defaultReps: 10,
  },
  {
    id: 'reverse-flys',
    name: 'Reverse Flys',
    aliases: ['reverse fly', 'reverse flies', 'rear delt fly', 'vorgebeugtes seitheben', 'butterfly reverse'],
    description: 'Vorgebeugtes Seitheben für die hintere Schulter und den oberen Rücken.',
    instructions:
      'Die Knie beugen und den Oberkörper mit geradem Rücken fast waagerecht nach vorne neigen. Die ' +
      'Kurzhanteln hängen mit leicht gebeugten Armen unter der Brust, die Handflächen zeigen ' +
      'zueinander. Die Arme in einem weiten Bogen seitlich bis auf Schulterhöhe öffnen, der ' +
      'Ellbogenwinkel bleibt dabei gleich. Oben kurz halten und langsam zurückführen.',
    formCues: ['Ellbogenwinkel nicht verändern', 'Nicht mit Schwung aus dem Oberkörper', 'Leichtes Gewicht, Schultern weg von den Ohren'],
    breathing: 'Beim Öffnen der Arme ausatmen, beim Zurückführen einatmen.',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    id: 'romanian-deadlift',
    name: 'Rumänisches Kreuzheben',
    aliases: ['romanian deadlift', 'rdl', 'kreuzheben', 'kreuzheben gestreckt', 'stiff leg deadlift', 'deadlift'],
    description: 'Hüftbeuge mit zwei Kurzhanteln für Beinrückseite und Gesäß.',
    instructions:
      'Hüftbreit stehen, die Kurzhanteln im Obergriff vor den Oberschenkeln. Die Knie leicht ' +
      'entriegeln und die Hüfte weit nach hinten schieben, der Rücken bleibt dabei gerade. Die Hanteln ' +
      'gleiten eng an den Beinen entlang nach unten, bis etwa auf Kniehöhe oder bis die Dehnung in der ' +
      'Beinrückseite deutlich wird. Die Hüfte kraftvoll nach vorne bringen und oben das Gesäß anspannen.',
    formCues: ['Rücken gerade, Blick zum Boden', 'Hanteln bleiben nah an den Beinen', 'Bewegung kommt aus der Hüfte, nicht aus den Knien'],
    breathing: 'Beim Absenken einatmen, beim Aufrichten ausatmen.',
    primaryMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'overhead-triceps-extension',
    name: 'Trizeps-Überkopfdrücken',
    aliases: ['overhead triceps extension', 'triceps extension', 'trizepsdrücken über kopf', 'french press', 'trizeps strecken'],
    description: 'Streckübung über dem Kopf für den langen Kopf des Trizeps.',
    instructions:
      'Aufrecht stehen und die Kurzhanteln im Neutralgriff mit gestreckten Armen über den Kopf ' +
      'bringen. Die Oberarme bleiben senkrecht neben dem Kopf, die Ellbogen zeigen nach vorne. Nur ' +
      'die Unterarme langsam hinter den Kopf absenken, bis die Ellbogen deutlich gebeugt sind. Aus dem ' +
      'Trizeps heraus wieder strecken, ohne die Oberarme zu bewegen.',
    formCues: ['Oberarme bleiben ruhig neben dem Kopf', 'Ellbogen zeigen nach vorne, nicht zur Seite', 'Rumpf fest, kein Hohlkreuz'],
    breathing: 'Beim Absenken einatmen, beim Strecken ausatmen.',
    primaryMuscle: 'triceps',
    secondaryMuscles: [],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'hammer-curls',
    name: 'Hammer-Curls',
    aliases: ['hammer curl', 'hammercurls', 'neutralgriff curls'],
    description: 'Curls im Neutralgriff für Bizeps, Oberarmmuskel und Unterarme.',
    instructions:
      'Aufrecht stehen, die Kurzhanteln seitlich am Körper, die Daumen zeigen nach vorne. Die ' +
      'Oberarme bleiben am Rumpf, während du die Hanteln durch Beugen im Ellbogen bis auf Schulterhöhe ' +
      'curlst. Der Griff dreht sich dabei nicht, die Daumen zeigen oben zu den Schultern. Kontrolliert ' +
      'absenken, bis die Arme gestreckt sind.',
    formCues: ['Handgelenke bleiben gerade', 'Ellbogen bleiben am Körper', 'Kein Schwung aus dem Rücken'],
    breathing: 'Beim Hochführen der Hanteln ausatmen, beim Ablassen einatmen.',
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
    id: 'calf-raises',
    name: 'Wadenheben',
    aliases: ['calf raise', 'calf raises', 'wadenheben stehend', 'zehenstand'],
    description: 'Fersenheben im Stand mit zwei Kurzhanteln für kräftige Waden.',
    instructions:
      'Aufrecht stehen, Füße hüftbreit, die Kurzhanteln hängen seitlich. Die Fersen so weit wie möglich ' +
      'anheben, bis du auf den Fußballen stehst, oben kurz halten. Langsam absenken, bis die Fersen ' +
      'wieder am Boden sind. Für mehr Bewegungsumfang mit den Fußballen auf einer Stufe stehen.',
    formCues: ['Knie gestreckt, aber nicht durchgedrückt', 'Oben eine Sekunde halten', 'Gewicht über dem großen Zeh'],
    breathing: 'Beim Anheben ausatmen, beim Absenken einatmen.',
    primaryMuscle: 'calves',
    secondaryMuscles: [],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 15,
  },
  {
    id: 'push-ups',
    name: 'Liegestütze',
    aliases: ['push ups', 'pushups', 'push-up', 'liegestütz', 'liegestuetze', 'liegestützen'],
    description: 'Die Grundübung ohne Gerät für Brust, Schultern und Trizeps – der Körper bleibt ein festes Brett.',
    instructions:
      'Die Hände etwas breiter als schulterbreit auf den Boden setzen, die Finger zeigen nach vorn, die ' +
      'Füße stehen hüftbreit auf den Zehenballen. Bauch und Gesäß anspannen, sodass Kopf, Rumpf und Beine ' +
      'eine Linie bilden. Die Ellbogen im Winkel von etwa 45° nach hinten beugen und die Brust bis knapp ' +
      'über den Boden absenken. Kraftvoll vom Boden wegdrücken, bis die Arme fast gestreckt sind.',
    formCues: ['Körper bleibt eine gerade Linie', 'Ellbogen etwa 45° vom Körper', 'Hüfte weder durchhängen lassen noch hochschieben'],
    breathing: 'Beim Absenken einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'core'],
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    usesWeight: false,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 12,
  },
  {
    id: 'diamond-push-ups',
    name: 'Diamond-Liegestütze',
    aliases: ['diamond push ups', 'diamond pushups', 'diamant liegestütze', 'enge liegestütze', 'trizeps liegestütze', 'close grip push ups'],
    description: 'Liegestütze mit eng zusammengeführten Händen – deutlich schwerer und mit klarem Fokus auf den Trizeps.',
    instructions:
      'In die Liegestützposition gehen und die Hände unter der Brust zusammenführen, sodass Daumen und ' +
      'Zeigefinger eine Raute bilden. Bauch und Gesäß anspannen. Die Brust kontrolliert zu den Händen ' +
      'absenken und die Ellbogen dabei eng am Oberkörper nach hinten führen. Aus dem Trizeps heraus wieder ' +
      'hochdrücken, ohne die Ellbogen nach außen klappen zu lassen.',
    formCues: ['Ellbogen eng am Körper', 'Hände unter der Brust, nicht unter dem Gesicht', 'Schultern weg von den Ohren'],
    breathing: 'Beim Absenken einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    usesWeight: false,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    id: 'pike-push-ups',
    name: 'Pike-Liegestütze',
    aliases: ['pike push ups', 'pike pushups', 'hecht liegestütze', 'schulter liegestütze', 'umgekehrtes v'],
    description: 'Liegestütze im umgekehrten V – trainiert die Schultern wie Überkopfdrücken mit dem eigenen Körpergewicht.',
    instructions:
      'Aus dem Liegestütz die Hüfte weit nach oben schieben, bis der Körper ein umgekehrtes V bildet. Die ' +
      'Hände stehen schulterbreit, die Beine bleiben möglichst gestreckt, das Gewicht liegt über den Händen. ' +
      'Die Ellbogen schräg nach hinten beugen und den Kopf kontrolliert zum Boden zwischen den Händen ' +
      'absenken. Kraftvoll zurück in die Ausgangsposition drücken.',
    formCues: ['Hüfte bleibt hoch', 'Ellbogen schräg nach hinten, nicht zur Seite', 'Kopf kurz vor dem Boden stoppen'],
    breathing: 'Beim Absenken des Kopfes einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    usesWeight: false,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    id: 'v-ups',
    name: 'V-Ups',
    aliases: ['v up', 'v-sit ups', 'klappmesser', 'taschenmesser', 'jackknife', 'jack knife'],
    description: 'Anspruchsvolle Bauchübung: Oberkörper und gestreckte Beine kommen gleichzeitig zum V nach oben.',
    instructions:
      'Flach auf den Rücken legen, die Arme gestreckt über dem Kopf, die Beine gestreckt und geschlossen. ' +
      'Den Bauch anspannen und den unteren Rücken in den Boden drücken. Oberkörper und Beine gleichzeitig ' +
      'anheben und mit den Händen Richtung Schienbeine greifen, bis du auf dem Gesäß balancierst. Langsam ' +
      'und kontrolliert in die Ausgangslage zurück absenken.',
    formCues: ['Beine bleiben gestreckt', 'Bewegung aus dem Bauch, nicht mit Schwung', 'Unteren Rücken beim Absenken kontrollieren'],
    breathing: 'Beim Hochkommen ausatmen, beim Absenken einatmen.',
    primaryMuscle: 'core',
    secondaryMuscles: ['obliques', 'quads'],
    category: 'core',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    usesWeight: false,
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarische Kniebeugen',
    aliases: ['bulgarian split squat', 'bulgarian split squats', 'split squats', 'bulgarische split squats', 'ausfallschritt bank'],
    description: 'Einbeinige Kniebeuge mit dem hinteren Fuß auf der Bank – fordert Beine, Gesäß und Gleichgewicht.',
    instructions:
      'Mit dem Rücken zur Bank stehen, je eine Kurzhantel seitlich in den Händen. Einen großen Schritt nach ' +
      'vorn machen und den Spann des hinteren Fußes auf die Bank legen. Das hintere Knie gerade nach unten ' +
      'Richtung Boden sinken lassen, bis der vordere Oberschenkel etwa waagerecht ist; der Oberkörper neigt ' +
      'sich dabei leicht nach vorn. Über die Ferse des vorderen Beins wieder hochdrücken. Erst alle ' +
      'Wiederholungen auf einer Seite, dann wechseln.',
    formCues: ['Vorderes Knie zeigt über die Zehen, nicht nach innen', 'Gewicht auf dem vorderen Bein', 'Hüfte bleibt gerade'],
    breathing: 'Beim Absenken einatmen, beim Hochdrücken ausatmen.',
    primaryMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'advanced',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    id: 'thrusters',
    name: 'Thrusters',
    aliases: ['thruster', 'kurzhantel thrusters', 'dumbbell thrusters', 'squat press', 'kniebeuge mit drücken'],
    description: 'Kniebeuge und Überkopfdrücken in einer fließenden Bewegung – Ganzkörperübung mit hohem Puls.',
    instructions:
      'Hüftbreit stehen, die Kurzhanteln vor den Schultern, die Ellbogen zeigen nach vorn unten. In eine ' +
      'tiefe Kniebeuge sinken, die Brust bleibt aufrecht, die Fersen am Boden. Explosiv aus den Beinen ' +
      'hochdrücken und den Schwung nutzen, um die Hanteln ohne Pause über den Kopf zu drücken, bis die Arme ' +
      'gestreckt sind. Die Hanteln kontrolliert zurück auf die Schultern führen und direkt in die nächste ' +
      'Kniebeuge gehen.',
    formCues: ['Erst die Beine, dann die Arme', 'Fersen bleiben am Boden', 'Oben kein Hohlkreuz'],
    breathing: 'Unten einatmen, beim Hochdrücken über den Kopf ausatmen.',
    primaryMuscle: 'quads',
    secondaryMuscles: ['shoulders', 'glutes', 'triceps'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    lowersFirst: true,
    defaultSets: 3,
    defaultReps: 10,
  },
  {
    id: 'renegade-rows',
    name: 'Renegade Rows',
    aliases: ['renegade row', 'plank rudern', 'rudern im liegestütz', 'liegestütz rudern', 'plank row'],
    description: 'Rudern aus dem hohen Liegestütz auf zwei Kurzhanteln – Rücken und Rumpf arbeiten zusammen.',
    instructions:
      'In den hohen Liegestütz gehen, die Hände umfassen zwei Kurzhanteln unter den Schultern, die Füße ' +
      'stehen etwas breiter als hüftbreit. Bauch und Gesäß fest anspannen. Eine Hantel zur unteren Rippe ' +
      'rudern, der Ellbogen streicht dabei eng am Körper nach hinten, ohne dass sich die Hüfte mitdreht. ' +
      'Kontrolliert absetzen und die Seite wechseln.',
    formCues: ['Hüfte bleibt parallel zum Boden', 'Breiter Fußstand für mehr Halt', 'Nur Hanteln verwenden, die nicht wegrollen'],
    breathing: 'Beim Rudern ausatmen, beim Absetzen einatmen.',
    primaryMuscle: 'back',
    secondaryMuscles: ['core', 'biceps', 'shoulders'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'advanced',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 8,
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    aliases: ['arnold presse', 'arnold drücken', 'arnold dumbbell press', 'schulterdrücken mit drehung'],
    description: 'Schulterdrücken mit Drehung der Handgelenke – trifft alle drei Anteile des Deltamuskels.',
    instructions:
      'Aufrecht stehen, die Kurzhanteln vor dem Gesicht auf Kinnhöhe, die Handflächen zeigen zu dir, die ' +
      'Ellbogen nach vorn. Beim Hochdrücken die Arme zur Seite öffnen und die Handgelenke nach außen drehen, ' +
      'sodass die Handflächen oben nach vorn zeigen. Über dem Kopf die Arme fast strecken, dann die Bewegung ' +
      'genau rückwärts ausführen.',
    formCues: ['Drehen und Drücken in einer Bewegung', 'Rumpf fest, kein Hohlkreuz', 'Oben nicht ganz durchstrecken'],
    breathing: 'Beim Hochdrücken ausatmen, beim Absenken einatmen.',
    primaryMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    category: 'strength',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    usesWeight: true,
    defaultSets: 3,
    defaultReps: 10,
  },
]

/** Holds for every exercise; shown next to each exercise's own breathing cue. */
export const BREATHING_RULE = 'Grundregel: bei der Anstrengung ausatmen, beim Nachgeben einatmen. Die Luft nicht anhalten.'

const buildSearchTerms = (name: string, aliases: string[]) =>
  [...new Set([name, ...aliases].map((term) => term.toLowerCase().trim()).filter(Boolean))]

/**
 * Order in the catalog, the picker and the tracker's suggestions: most worth doing first, i.e. a
 * big training effect for little technique. Easy staples lead (one per body region), then the
 * basic compound lifts, then isolation and accessory work, and the advanced exercises close the
 * list. A new exercise must be placed here (a test checks the list matches the catalog).
 */
export const CATALOG_ORDER = [
  // Easy and effective: learned in minutes, train a lot.
  'bicep-curls',
  'one-arm-dumbbell-row',
  'lunges',
  'lateral-raises',
  // Basic compound lifts: a little more technique, the most effect.
  'wide-grip-bench-press',
  'squats',
  'military-press',
  'romanian-deadlift',
  'bent-over-row',
  'push-ups',
  // Isolation and accessory exercises.
  'butterflies',
  'overhead-triceps-extension',
  'hammer-curls',
  'reverse-flys',
  'crunches',
  'close-grip-bench-press',
  'front-raises',
  'russian-twists',
  'calf-raises',
  // More coordination, then the advanced exercises.
  'arnold-press',
  'thrusters',
  'bulgarian-split-squat',
  'renegade-rows',
  'diamond-push-ups',
  'pike-push-ups',
  'v-ups',
] as const

const catalogRank = (id: string) => {
  const rank = (CATALOG_ORDER as readonly string[]).indexOf(id)
  return rank === -1 ? CATALOG_ORDER.length : rank
}

/** All exercises in catalog order (see `CATALOG_ORDER`). */
export const EXERCISES: Exercise[] = DEFINITIONS.map(({ aliases, ...definition }) => ({
  ...definition,
  searchTerms: buildSearchTerms(definition.name, aliases),
})).sort((a, b) => catalogRank(a.id) - catalogRank(b.id) || a.name.localeCompare(b.name, 'de'))

const EXERCISES_BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))

/** Looks up a catalog exercise; `undefined` only for IDs that were removed from the catalog. */
export const getExercise = (id: string) => EXERCISES_BY_ID.get(id)
