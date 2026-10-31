# GymFlow

Fitness-Tracking-App: React 19 + Vite + TypeScript, Tailwind CSS v4, Framer Motion, Lucide, Recharts, Firebase (Firestore + Auth, Projekt `gymflow-917db`).

## Start

```bash
npm install
npm run dev
```

Die Firebase-Web-Config liegt in `.env.local` (nicht im Git, Vorlage: `.env.example`). Ohne diese Werte läuft die App im **Demo-Modus** mit localStorage, die UI verhält sich identisch.

### Einmalig in der Firebase Console

1. **Firestore Database** anlegen (Production Mode).
2. **Authentication → Anmeldemethoden → E-Mail/Passwort** aktivieren. Die Option „Anonym“ und gegebenenfalls „Google“ deaktivieren, beide werden nicht mehr genutzt.
3. Security Rules deployen: `npx firebase-tools deploy --only firestore:rules --project gymflow-917db`
4. **Ersten Admin anlegen.** Danach legt der Admin alle weiteren Nutzer im Admin-Bereich der App an.
   1. *Authentication → Nutzer → Nutzer hinzufügen*: E-Mail und Passwort eingeben und die angezeigte **Nutzer-UID** kopieren.
   2. *Firestore Database → Sammlung `users`* (bei Bedarf „Sammlung starten“) → Dokument mit **Dokument-ID = UID** und diesen Feldern:

      | Feld | Typ | Wert |
      |---|---|---|
      | `email` | string | die Login-E-Mail |
      | `displayName` | string | z. B. „Karsten Lamest“ |
      | `role` | string | `admin` |
      | `status` | string | `active` |
      | `weeklyGoalDays` | number | `3` |
      | `createdBy` | null | – |

   3. In der App mit dieser E-Mail anmelden. Der Tab „Admin“ erscheint.

## Authentifizierung & Rollen

- **Geschlossenes System:** Login mit Benutzername oder E-Mail plus Passwort, und es gibt keine Registrierungsseite. Konten legt ausschließlich ein Admin im Admin-Bereich an. Dafür nutzt die App eine zweite, unsichtbare Firebase-Instanz, damit der Admin angemeldet bleibt.
- **Zugriff:** Firebase Auth weist nur die Identität nach. Zugriff auf Daten gibt es erst, wenn das Dokument `users/{uid}` existiert und `status: 'active'` hat. Das prüfen die Security Rules bei jeder Anfrage. Wer sich über die öffentliche Firebase-API selbst registriert, hat daher keinen Zugriff.
- **Rollen** (`role: 'admin' | 'user'`) stehen im selben Dokument. Niemand kann die eigene Rolle oder den eigenen Status ändern, damit sich auch kein Admin aussperrt. Im Client steuert die Rolle nur, was angezeigt wird. Durchgesetzt wird sie von den Rules.
- **Sperren** setzt `status: 'disabled'`. Die Sperre wirkt sofort, auch in bereits offenen Sitzungen, weil das Konto-Dokument live abonniert wird.
- **Löschen** entfernt das Konto-Dokument und alle Trainingsdaten. Den Login selbst kann man im kostenlosen Spark-Tarif nur in der Firebase Console löschen (Authentication → Nutzer). Er hat ohne Konto-Dokument aber keinerlei Zugriff mehr.
- **Passwort vergessen / ändern:** über Firebases Reset-Mail mit deutscher Vorlage, erreichbar über den Login-Screen (mit Benutzername oder E-Mail), das Profil oder den Admin.
- **Benutzername-Login:** Firebase Auth kennt nur E-Mail und Passwort. Jeder Benutzername steht deshalb zusätzlich in `usernames/{name}` mit der Login-E-Mail. Enthält die Eingabe im Login ein `@`, ist sie eine E-Mail, sonst schlägt die App den Benutzernamen dort nach und meldet sich mit der E-Mail an. Der Admin vergibt den Benutzernamen beim Anlegen (Vorschlag aus dem Namen) und kann ihn in der Nutzerverwaltung setzen oder ändern; Konto und Eintrag werden immer gemeinsam in einem Batch geschrieben. Erlaubt sind 3–20 Zeichen aus Kleinbuchstaben, Ziffern, `.`, `-` und `_`.
- **Bewusster Kompromiss:** Weil das Nachschlagen vor der Anmeldung passiert, darf jeder einzelne Benutzernamen abfragen. Wer einen Benutzernamen kennt, erfährt also die zugehörige E-Mail. Eine Liste aller Benutzernamen gibt es nicht. Ohne Cloud Functions lässt sich das nicht vermeiden.

**Rechteverteilung** (umgesetzt in [firestore.rules](firestore.rules), geprüft mit `npm run test:rules`):

| Daten | Nutzer (aktiv) | Nutzer (gesperrt) | Admin | Login ohne Konto |
|---|---|---|---|---|
| eigenes `users/{uid}` | lesen; nur `weeklyGoalDays`/`dumbbellKg`/`lastLoginAt`, die XP-Felder und einmalig `onboardingCompletedAt` ändern | lesen | lesen; Name und Benutzername ändern | (fehlt) lesen |
| fremde `users/{uid}` | – | – | lesen, anlegen, Name/Benutzername/Rolle/Status ändern, löschen (XP **nie**) | – |
| `usernames/{name}` | einzeln lesen | einzeln lesen | einzeln lesen; anlegen/löschen nur zusammen mit dem Konto | einzeln lesen (auch abgemeldet) |
| eigene `workout_logs` | lesen, schreiben, löschen | – | lesen, schreiben, löschen | – |
| fremde `workout_logs` | – | – | lesen und löschen (für Kontolöschung), **nie** schreiben | – |
| eigene `templates`, `body_weights` | lesen, schreiben, löschen (mit Validierung) | – | wie bei `workout_logs` | – |
| fremde `templates`, `body_weights` | – | – | lesen und löschen, **nie** schreiben | – |
| `exercises` | gibt es nicht: fester Katalog im Code | | | |

### Tests

```bash
npm test             # Unit-Tests (Vitest): XP & Level, Rekorde, Wochenrückblick, CSV, Körpergewicht, Statistik, Datum, Benutzernamen, Animationen
npm run test:watch   # dasselbe im Watch-Modus
npm run test:rules   # Security Rules gegen den Firestore-Emulator
```

- **Unit-Tests** liegen neben dem Code (`*.test.ts` in `src/`), gemeinsame Testdaten in `src/test/fixtures.ts`. Sie laufen in der Zeitzone Europe/Berlin, damit Sommer-/Winterzeit überall gleich geprüft wird.
- **Rules-Tests** (`tests/`) starten den Firestore-Emulator mit dem Projekt `demo-gymflow`, ohne Zugriff auf echte Daten, und prüfen 109 Fälle über alle Rollen hinweg. Voraussetzungen: Firebase CLI und Java 21+ im PATH.
- **CI:** Die GitHub Action [ci.yml](.github/workflows/ci.yml) führt bei jedem Push Lint, Unit-Tests, Build und die Rules-Tests aus.

## Übungskatalog

GymFlow hat einen **festen Übungskatalog** in [src/data/exercises.ts](src/data/exercises.ts). Nutzer können keine eigenen Übungen anlegen, bearbeiten oder löschen. Dadurch ist jede Übung exakt den richtigen Muskelgruppen zugeordnet, und die Statistiken bleiben verlässlich. Der Katalog liegt nicht in Firestore: Er kostet keine Reads, funktioniert offline und wird mit der App versioniert.

**Neue Übung hinzufügen**: Eintrag im Array `DEFINITIONS` mit neuer, eindeutiger Slug-ID ergänzen (z. B. `cable-rows`). IDs bestehender Übungen **nie ändern oder wiederverwenden**, denn gespeicherte Trainings referenzieren sie. Für die Animation zusätzlich einen Eintrag in `EXERCISE_ANIMATIONS` anlegen (siehe unten); ohne ihn zeigt die Übung einfach keine.

**Animationen:** Jede Übung hat eine animierte 3D-Figur, die eine Wiederholung im passenden Tempo vormacht (langsam in der exzentrischen Phase). Der Zielmuskel leuchtet neongrün, unterstützende Muskeln heller. Im Katalog steht die Figur still und bewegt sich beim Hovern, jeweils aus dem Blickwinkel, der die Bewegung am besten zeigt. In der Detailansicht läuft sie in Schleife, lässt sich anhalten und per Ziehen (oder Pfeiltasten) frei drehen; „Schräg“, „Vorne“ und „Seite“ gleiten zu festen Winkeln. Mit „Bewegung reduzieren“ im Betriebssystem bleibt sie stehen. Aufbau in [animation/](src/features/exercises/animation/): [rig.ts](src/features/exercises/animation/rig.ts) ist ein kleines 3D-Skelett, dessen Posen Richtungen der Körpersegmente sind. Interpoliert wird per Slerp, damit die Gliedmaßen ihre Länge behalten. Hände können per Inverse Kinematics an Zielpunkte gesetzt werden (Hanteln auf gerader Bahn). [poses.ts](src/features/exercises/animation/poses.ts) enthält pro Übung Start- und Umkehrpose, Griff, Tempo, Muskeln, Equipment und Kamera. [scene.ts](src/features/exercises/animation/scene.ts) baut daraus Kapseln, Kugeln und Rumpf-Hüllen, [camera.ts](src/features/exercises/animation/camera.ts) projiziert sie perspektivisch. [ExerciseFigure.tsx](src/features/exercises/animation/ExerciseFigure.tsx) zeichnet alles von hinten nach vorn als SVG, mit Glanzlicht, Tiefen-Abblendung, Bodenschatten und einer Plattform, die sich mitdreht. Die Reihenfolge legt [paintOrder.ts](src/features/exercises/animation/paintOrder.ts) fest. Damit nichts flackert, gelten dabei einige Regeln: Die Tiefe wird um die Wirbelsäule gemessen. Fast gleich tiefe Teile behalten ihre Reihenfolge. Bauch und Brust ordnet die Ebene, an der sie sich treffen. Ellbogen, Knie und Knöchel werden ohne Überlappung zwischen den beiden Segmenten aufgeteilt, sodass ein Wechsel der Reihenfolge dort unsichtbar bleibt. Alle Übungen sind für zwei leichte Kurzhanteln ausgelegt (z. B. 5 kg) und zeigen sie auch so; ein Test prüft, dass Animation und Katalog dieselbe Ausrüstung nennen. Kein WebGL, keine Bilddateien, keine Lizenzfragen, und es funktioniert offline.

Felder: `id`, `name`, `description`, `instructions`, `formCues[]`, `primaryMuscle`, `secondaryMuscles[]`, `category`, `equipment`, `difficulty`, `usesWeight`, `defaultSets`, `defaultReps`, `aliases[]` (Suchbegriffe).

## Firestore-Schema

```
users/{uid}                               Konto: Rolle, Status, Profil
users/{uid}/workout_logs/{YYYY-MM-DD}     Genau ein Dokument pro Trainingstag
users/{uid}/templates/{id}                Eigene Trainingsvorlagen
users/{uid}/body_weights/{YYYY-MM-DD}     Körpergewicht, ein Eintrag pro Tag
usernames/{name}                          Benutzername → { uid, email } für den Login
```

**`users/{uid}`** (Dokument-ID = Firebase-Auth-UID):
```jsonc
{
  "email": "anna@example.de",     // vom Admin beim Anlegen gesetzt, unveränderlich
  "username": "anna.schneider",   // alternativer Login, eindeutig, nur vom Admin änderbar; fehlt bei alten Konten
  "displayName": "Anna Schneider",
  "role": "user",                 // "admin" | "user", nur ein anderer Admin darf es ändern
  "status": "active",             // "active" | "disabled", nur ein anderer Admin darf es ändern
  "weeklyGoalDays": 3,            // 1–7, vom Nutzer selbst änderbar
  "createdAt": Timestamp, "createdBy": "admin-uid", "updatedAt": Timestamp,
  "lastLoginAt": Timestamp,       // für „Zuletzt aktiv“ in der Nutzerverwaltung
  "onboardingCompletedAt": Timestamp,  // Einführung abgeschlossen/übersprungen; fehlt = Einführung erscheint beim Start

  // Gamification: fehlt bis zum ersten Sync der App, danach immer vollständig (siehe „Level & Erfolge“)
  "currentXP": 1200,              // XP innerhalb des aktuellen Levels
  "totalXP": 1700,                // alle je verdienten XP, bestimmen Level und Rang
  "level": 2,
  "rank": "iron",                 // iron | bronze | silver | gold | platinum | diamond | grandmaster
  "unlockedAchievements": { "iron-will": "2026-10-19" }  // Achievement-ID → Tag der Freischaltung
}
```

Das Farbschema (Hell/Dunkel/System) wird pro Gerät in `localStorage` gespeichert, nicht in Firestore.

**`users/{uid}/workout_logs/{date}`**:
```jsonc
{
  "userId": "abc",              // redundant zum Pfad, ermöglicht Collection-Group-Queries
  "date": "2026-10-18",         // = Dokument-ID, lexikografisch sortierbar
  "entries": [{
    "id": "uuid", "exerciseId": "squats", "position": 0,
    "exerciseName": "Squats (Kniebeugen)",  // denormalisiert: Historie bleibt bei Umbenennung intakt
    "primaryMuscle": "quads", "secondaryMuscles": ["glutes"], "usesWeight": true,
    "sets": [{ "id": "uuid", "reps": 8, "weightKg": 80 }]
  }],
  "totals": { "exercises": 1, "sets": 1, "reps": 8, "volumeKg": 640 },  // bei jedem Write voraggregiert
  "muscleGroupReps": { "quads": 8 },
  "createdAt": Timestamp, "updatedAt": Timestamp
}
```

**`users/{uid}/templates/{id}`**: `{ "name": "Push Montag", "exercises": [{ "exerciseId": "squats", "sets": [{ "reps": 8, "weightKg": 80 }] }], "createdAt": Timestamp }` (Name 1–40 Zeichen, 1–20 Übungen). Die mitgelieferten Vorlagen stehen in [templates.ts](src/data/templates.ts), nicht in Firestore.

**`users/{uid}/body_weights/{date}`**: `{ "date": "2026-10-24", "weightKg": 82.4, "updatedAt": Timestamp }` (20–400 kg; ein zweiter Eintrag am selben Tag überschreibt den ersten).

**Designentscheidungen**
- *Ein Dokument pro Tag* statt eines Dokuments pro Satz: Ein Tag kostet einen Read und einen Write, und das Jahres-Heatmap braucht höchstens 365 Reads.
- *Voraggregierte `totals`/`muscleGroupReps`*: Dashboard-Charts lesen nur Zahlen und iterieren nicht über Sätze.
- *Subcollection pro User*: Range-Queries (`date >= x && date <= y`) laufen auf einem Feld, brauchen also keinen Composite-Index, und die Rules hängen direkt am Pfad.
- *Denormalisierte Übungsdaten in Einträgen* (Name, Muskeln): Die Historie bleibt korrekt, auch wenn eine Übung im Katalog später umbenannt wird.
- Offline-first über `persistentLocalCache`: Writes landen sofort lokal und synchronisieren, sobald wieder Empfang da ist.

## Statistik

Der Tab „Statistik“ lädt die Logs der letzten 12 Monate (höchstens 365 Reads) und berechnet alles clientseitig ([src/lib/stats.ts](src/lib/stats.ts)):

- **Diese Woche:** Wochenziel-Ring, Wiederholungen, Volumen (jeweils im Vergleich mit denselben Wochentagen der Vorwoche) und die Serie aktiver Wochen
- **Pro Woche:** Säulen über die letzten 12 Kalenderwochen, umschaltbar zwischen Wiederholungen, Sätzen und Volumen; die laufende Woche ist heller dargestellt
- **Muskelgruppen:** Sätze pro Muskelgruppe für 7, 30 oder 90 Tage; Hilfsmuskeln zählen optional mit ½
- **Aktivität:** Heatmap über 12 Monate auf dem Desktop bzw. 6 Monate auf dem Handy, Stufen nach Quartilen
- **Fortschritt:** schwerster Satz bzw. Wiederholungen pro Training und Übung, dazu Bestleistungen

Die Diagrammfarben stehen in [chartTheme.ts](src/features/stats/chartTheme.ts) und sind gegen die Kartenflächen auf Kontrast geprüft. Im Light Mode ist das Grün deshalb dunkler als die Akzentfarbe.

## Level & Erfolge

Im Profil zeigt GymFlow Level, Rang (Liga) und Erfolge. Logik: [gamificationService.ts](src/services/gamificationService.ts), Ränge: [ranks.ts](src/data/ranks.ts), Erfolge: [achievements.ts](src/data/achievements.ts).

- **XP:** 15 pro Satz, 150 pro Workout (= Trainingstag mit mindestens einem Satz), 500 Bonus an jedem 3. Tag am Stück (Tag 3, 6, 9, … einer Serie). Dazu ein Gewichts-Bonus: +1 XP je 20 kg Volumen eines Satzes, höchstens 15 XP pro Satz, damit absurde Gewichte nichts bringen. Beispiel: 12 Wdh. mit zwei 5-kg-Hanteln = 120 kg → +6 XP.
- **Gewicht je Hantel:** Alle Übungen sind für zwei Kurzhanteln ausgelegt. Eingetragen wird das Gewicht einer Hantel (Spalte „kg je Hantel“, ±1 kg), das Volumen zählt beide Hände (Wdh. × 2 × kg). Neue Übungen starten mit einem Satz à 10 Wiederholungen (die Katalog-Angabe `defaultSets × defaultReps` ist nur eine Empfehlung) und dem Hantelgewicht aus dem Profil („Meine Kurzhanteln“, Standard 5 kg, gespeichert als `users/{uid}.dumbbellKg`, 0,5–50 kg); Vorlagen behalten ihre geplanten Gewichte. Neue Einträge merken sich das in `perDumbbell`; ältere Einträge ohne das Feld gelten weiter als Gesamtgewicht und werden nicht verdoppelt. Bestleistungen und der Verlauf pro Übung zeigen das Gewicht je Hantel.
- **Level:** Für den Schritt von Level `n` auf `n + 1` braucht es `floor(100 · n^1,1)` XP (100, 214, 334, …). Bei rund 450 XP pro Workout und 3–4 Workouts pro Woche heißt das: Bronze nach ~12 Workouts, Silber nach ~54, Gold nach ~1,3 Jahren, Platin nach ~3, Diamant nach ~5,7 und Grandmaster nach ~9 Jahren. Die ursprünglich vorgesehene Kurve `500 · n^1,5` hätte für Gold ~4.400 Workouts gebraucht. Die Konstanten stehen oben in `gamificationService.ts`.
- **Ränge:** Eisen (1–9), Bronze (10–19), Silber (20–39), Gold (40–59), Platin (60–79), Diamant (80–99), Grandmaster (ab 100).
- **Abgeleitet statt vergeben:** XP werden bei jeder Änderung aus der gesamten Trainingshistorie neu berechnet, nicht pro Aktion aufaddiert. Weil Trainingstage bearbeitbar sind, ließen sich XP sonst durch Löschen und erneutes Anlegen von Sätzen farmen, und Korrekturen an alten Tagen würden sie verfälschen. Wer Sätze löscht, verliert die XP dafür wieder. Erfolge bleiben dagegen dauerhaft freigeschaltet.
- **Erst am nächsten Tag gutgeschrieben:** Gezählt werden nur abgeschlossene Tage (vor heute). Der laufende Tag erscheint als „+X XP für heute“ im Tracker und im Profil, Level-Up, Erfolge und Toasts kommen erst am nächsten Tag. So bringt eine versehentlich angelegte und wieder gelöschte Übung weder XP noch einen dauerhaften Erfolg. Nachträge an vergangenen Tagen zählen sofort, weil diese Tage schon abgeschlossen sind.
- **Sync:** Der `GamificationProvider` lädt alle Trainingstage (ein kleines Dokument pro Tag), berechnet den Stand und spiegelt ihn in `users/{uid}`. Bei einem Level-Up, neuen Rang oder Erfolg erscheint ein Toast. Der erste Sync eines Kontos mit bestehender Historie läuft still, damit nicht alles auf einmal gefeiert wird.
- **Grenze ohne Server:** Die Rules prüfen nur Form und Plausibilität der XP-Felder. Da der Client sie berechnet, könnte ein manipulierter Client sich eigene XP schreiben, aber nie die eines anderen. Für eine Rangliste müsste die Berechnung in eine Cloud Function (Blaze-Tarif).

## Training im Tracker

Gebaut für den Ablauf „Satz machen, eintragen, Pause, nächster Satz“ mit einer Hand.

- **Nur erledigte Sätze werden gespeichert.** Eine neue Übung hat 0 Sätze, kommt aber mit aufgeklapptem Satz 1 (bei einer Vorlage nur die erste Übung). **„Satz hinzufügen“** öffnet den nächsten Satz mit vorbelegten Werten in den Steppern, **„Satz abhaken“** speichert ihn; mit ✕ wird er verworfen. Gespeicherte Sätze öffnet ein Tipp zum Korrigieren (Änderungen gelten sofort, „Satz abhaken“ oder die Kopfzeile „Satz n ˄“ klappt wieder zu); der Papierkorb an jeder Zeile fragt „Satz n löschen?“, bevor er löscht. Bis zum Abhaken ist er nur ein Entwurf; der liegt pro Übung in `localStorage` ([setDrafts.ts](src/lib/setDrafts.ts)) und übersteht so Tab-Wechsel, Neuladen und das Öffnen eines älteren Satzes (nach 12 Stunden verfällt er). Eine versehentlich hinzugefügte Übung zählt so für nichts: Statistik, Heatmap und Wochenstreifen beachten nur Tage mit mindestens einem Satz (`trainingDays` in [stats.ts](src/lib/stats.ts)).
- **Woher die vorbelegten Werte kommen** ([plannedSet.ts](src/lib/plannedSet.ts)): Satz n der letzten Einheit dieser Übung vor dem gewählten Tag, sonst die Werte der Vorlage (`plannedSets` am Eintrag), sonst eine Kopie des letzten Satzes von heute, sonst 10 Wiederholungen mit dem eigenen Hantelgewicht. Ältere Einträge mit Gesamtgewicht statt Gewicht je Hantel liefern nur die Wiederholungen.
- **„Letztes Mal“** steht unter dem Übungsnamen mit allen Wiederholungszahlen („12, 10, 8 Wdh. mit 8 kg“), weil man sich mit einem festen Hantelpaar vor allem über Wiederholungen steigert.
- **Satz-Timer** ([restTimer.ts](src/lib/restTimer.ts), [features/rest/](src/features/rest/)): Jeder abgehakte Satz von heute startet die Pause (Einstellung im Profil, 30 s bis 5 min, Standard 90 s, pro Gerät). Die Leiste über der Tab-Leiste bleibt auf allen Tabs, mit ±15 s und Beenden; danach zählt sie die Überzeit. Gespeichert sind nur Startzeit und Dauer in `localStorage`, darum stimmt sie auch nach Neuladen oder gesperrtem Bildschirm. Während der Pause hält die Wake-Lock-API den Bildschirm an. Am Ende kommen drei Töne über Web Audio ([sound.ts](src/lib/sound.ts)), freigeschaltet beim Tipp auf ✓, wie iOS es verlangt. Vibration gibt es auf dem iPhone nicht.

## Motivation & Komfort

- **Bestleistungen feiern:** Schlägt ein Satz den bisherigen Rekord einer Übung (schwerstes Gewicht, bei Körpergewichtsübungen die meisten Wiederholungen), erscheint ein Reward-Toast mit altem und neuem Wert. Die App wartet 1,5 Sekunden, bis das Gewicht nicht mehr verändert wird, und meldet jede Übung höchstens einmal pro Tag. Rekorde aus der Vergangenheit lösen beim Start nichts aus. Logik: [records.ts](src/lib/records.ts).
- **Trainingsvorlagen:** Im Tracker unter „Vorlagen“: vier mitgelieferte Vorlagen (Push, Beine & Core, Arme & Schultern, Ganzkörper) und eigene, die man aus einem eingetragenen Tag speichert, mit allen Sätzen und Gewichten. Beim Anwenden kommen nur Übungen dazu, die an dem Tag noch fehlen, und zwar ohne Sätze: Die Werte der Vorlage füllen nur die Vorschau von Übungen, die man noch nie gemacht hat. Sonst gilt das letzte Mal. Eine reine „Pull“-Vorlage folgt, sobald der Katalog Rückenübungen hat.
- **Wochenrückblick:** Montag bis Mittwoch oben im Tab „Heute“: Trainingstage gegenüber dem Wochenziel, Sätze und Volumen im Vergleich zur Woche davor, neue Bestleistungen und freigeschaltete Erfolge der Woche. Wegklicken gilt pro Gerät für diese Woche. Logik: [weeklyRecap.ts](src/lib/weeklyRecap.ts).
- **Körpergewicht:** Im Profil: Eintrag pro Tag, Veränderung über 30 Tage und Verlauf der letzten 90 Tage.
- **CSV-Export:** Im Profil, für Trainingsdaten (eine Zeile pro Satz) und Körpergewicht. Format für deutsches Excel: Semikolon, Dezimalkomma, UTF-8 mit BOM. Die Datei entsteht im Browser, es wird nichts hochgeladen.

## Einführung (Onboarding)

Beim ersten Start zeigt GymFlow eine kurze Tour in fünf Schritten: Begrüßung, Tracker, Übungen mit Animation, Level & XP und das Wochenziel (direkt wählbar). Sie erscheint, solange `users/{uid}.onboardingCompletedAt` fehlt, also auch nach einem Neuladen mitten in der Tour und auf jedem Gerät, bis sie abgeschlossen oder übersprungen wird. Gesetzt wird das Feld mit der Serverzeit, und die Rules erlauben es nur einmal und nur dem Nutzer selbst. Im Profil lässt sich die Tour über „Einführung ansehen“ jederzeit wieder öffnen, ohne dass sich am gespeicherten Status etwas ändert. Der Code der Tour wird nur geladen, wenn sie gebraucht wird.

## Ladezeit

Beim Start lädt GymFlow rund 344 KB (gzip). Den Großteil machen Firestore (171 KB, nötig für Echtzeit und Offline-Cache) und React (68 KB) aus. Was dafür sorgt, dass es nicht mehr wird:
- **Tabs lazy:** Übungen, Statistik (inkl. Recharts, 119 KB), Profil und Admin sind eigene Chunks und werden nach dem Start im Leerlauf vorgeladen.
- **Framer Motion per `LazyMotion`:** Die Komponenten heißen `m.*` statt `motion.*`; die Animations-Engine (19 KB) kommt als eigener Chunk direkt nach dem ersten Rendern. `strict` meldet versehentliche `motion.*`-Komponenten als Fehler.
- **Firebase Auth über `initializeAuth`** statt `getAuth`, damit der ungenutzte Code für Popup-/Redirect-Logins entfällt.
- Firebase und React liegen in eigenen, lange cachebaren Chunks; ein App-Update lädt sie nicht neu.

## PWA

GymFlow lässt sich als App installieren: über `public/manifest.webmanifest` mit Icons und einen Service Worker (`public/sw.js`, nur im Production-Build registriert), der die App-Hülle offline bereithält. Die Trainingsdaten selbst puffert Firestore offline. Die Installation setzt HTTPS voraus, deshalb läuft GymFlow auf Vercel.

## Hosting

GymFlow liegt auf **Vercel** unter **https://gym-flow-alpha-six.vercel.app**. Das Vercel-Projekt ist mit dem GitHub-Repo verbunden: Jeder Push auf `main` wird automatisch gebaut und veröffentlicht. Die Firebase-Config steht dort als Umgebungsvariablen (`VITE_FIREBASE_*`, wie in `.env.example`); fehlen sie, läuft online der Demo-Modus. Die Domain muss in der Firebase Console unter Authentication → Einstellungen → Autorisierte Domains stehen.

Nicht über Vercel laufen die **Security Rules**. Nach jeder Änderung an `firestore.rules`:

```bash
npx firebase-tools deploy --only firestore:rules --project gymflow-917db
```

## Struktur

```
src/
  types/models.ts            Domain-Typen (Exercise, WorkoutLog, …)
  data/exercises.ts          Fester Übungskatalog inkl. Ausführungserklärungen
  data/muscleGroups.ts       Labels & Farben
  data/ranks.ts              Ränge (Ligen) mit Level-Schwellen, Farben, Icons
  data/achievements.ts       Erfolge (Schwellenwerte auf Trainingskennzahlen)
  data/templates.ts          Mitgelieferte Trainingsvorlagen
  services/                  Repository-Interface + Firestore- und localStorage-Implementierung
  services/gamificationService.ts  XP-Kurve, Level, Rang, Erfolge, Level-Up-Erkennung
  lib/stats.ts               Auswertungen für das Dashboard
  lib/records.ts             Bestleistungen und deren Verbesserungen
  lib/weeklyRecap.ts         Wochenrückblick (letzte Woche vs. Woche davor)
  lib/bodyWeight.ts          Körpergewicht: Eingabe, Trend, Diagrammpunkte
  lib/csv.ts                 CSV-Export für Excel
  lib/exerciseHistory.ts     Einheiten pro Übung, „Letztes Mal“
  lib/plannedSet.ts          Vorbelegte Werte des nächsten Satzes
  lib/restTimer.ts           Satz-Timer: Restzeit, Anzeige, Einstellung
  lib/sound.ts               Ton am Pausenende (Web Audio)
  lib/pwa.ts                 Service-Worker-Registrierung, Install-Prompt
  lib/passwords.ts           Sichere Startpasswörter für neue Konten
  lib/usernames.ts           Benutzernamen: Format, Normalisierung, Vorschlag aus dem Namen
  auth/                      AuthProvider, useAuth/useSession, deutsche Fehlermeldungen
  hooks/                     useLogsInRange, useAllLogs, useAllUsers, useDayDraft, useTheme
  components/                AppShell (Sidebar/TabBar), Sheet, Toasts, SegmentedControl, NumberStepper, AnimatedNumber
  features/tracker/          Daily Tracker (WeekStrip, DaySummary, ExerciseEntryCard, ExercisePicker, TemplateSheet, WeeklyRecapCard)
  features/rest/             Satz-Timer: Provider (Speicher, Ton, Wake Lock) und Pausenleiste
  features/exercises/        Übungskatalog und Detail-Sheet; animation/ mit 3D-Skelett, Posen, Kamera und SVG-Figur
  features/stats/            Statistik-Dashboard (Recharts, lazy geladen)
  features/auth/             Login-Screen (inkl. Passwort vergessen), Kein-Zugang-Screen
  features/admin/            Nutzerverwaltung: Liste (mit Level), Anlegen, Bearbeiten, Sperren, Löschen
  features/gamification/     GamificationProvider (Sync + Toasts), GamificationDashboard (Level, Rang, Erfolge), RankBadge/LevelBadge
  features/onboarding/       Einführung beim ersten Start (lazy geladen)
  features/profile/          Profil: Konto, Level & Erfolge, Körpergewicht, Export, Passwort ändern, Wochenziel, Darstellung, App installieren, Einführung
  test/fixtures.ts           Testdaten-Bausteine für die Unit-Tests (*.test.ts neben dem Code)
public/                      Manifest, Icons, Service Worker
firestore.rules              Security Rules (RBAC)
tests/                       Rules-Tests gegen den Firestore-Emulator
.github/workflows/ci.yml     CI: Lint, Unit-Tests, Build, Rules-Tests
```
