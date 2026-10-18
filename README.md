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
2. **Authentication → Anmeldemethoden → Anonym** aktivieren (Nutzer können später per `linkWithPopup` auf Google/Apple upgraden, ohne Daten zu verlieren).
3. Security Rules deployen: `npx firebase-tools deploy --only firestore`

## Übungskatalog

GymFlow hat einen **festen Übungskatalog** in [src/data/exercises.ts](src/data/exercises.ts). Nutzer können keine eigenen Übungen anlegen, bearbeiten oder löschen. Dadurch ist jede Übung exakt den richtigen Muskelgruppen zugeordnet, und die Statistiken bleiben verlässlich. Der Katalog liegt nicht in Firestore: Er kostet keine Reads, funktioniert offline und wird mit der App versioniert.

**Neue Übung hinzufügen**: Eintrag im Array `DEFINITIONS` mit neuer, eindeutiger Slug-ID ergänzen (z. B. `cable-rows`). IDs bestehender Übungen **nie ändern oder wiederverwenden**, denn gespeicherte Trainings referenzieren sie.

Felder: `id`, `name`, `description`, `instructions`, `formCues[]`, `primaryMuscle`, `secondaryMuscles[]`, `category`, `equipment`, `difficulty`, `usesWeight`, `defaultSets`, `defaultReps`, `aliases[]` (Suchbegriffe).

## Firestore-Schema

```
users/{uid}                               Profil & Einstellungen
users/{uid}/workout_logs/{YYYY-MM-DD}     Genau ein Dokument pro Trainingstag
```

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

**Designentscheidungen**
- *Ein Dokument pro Tag* statt eines Dokuments pro Satz: Ein Tag kostet einen Read und einen Write, und das Jahres-Heatmap braucht höchstens 365 Reads.
- *Voraggregierte `totals`/`muscleGroupReps`*: Dashboard-Charts lesen nur Zahlen und iterieren nicht über Sätze.
- *Subcollection pro User*: Range-Queries (`date >= x && date <= y`) laufen auf einem Feld, brauchen also keinen Composite-Index, und die Rules hängen direkt am Pfad.
- *Denormalisierte Übungsdaten in Einträgen* (Name, Muskeln): Die Historie bleibt korrekt, auch wenn eine Übung im Katalog später umbenannt wird.
- Offline-first über `persistentLocalCache`: Writes landen sofort lokal und synchronisieren, sobald wieder Empfang da ist.

## Struktur

```
src/
  types/models.ts            Domain-Typen (Exercise, WorkoutLog, …)
  data/exercises.ts          Fester Übungskatalog inkl. Ausführungserklärungen
  data/muscleGroups.ts       Labels & Farben
  services/                  Repository-Interface + Firestore- und localStorage-Implementierung
  hooks/                     useLogsInRange, useDayDraft (optimistisch + debounced save)
  components/                AppShell (Sidebar/TabBar), Sheet, NumberStepper, AnimatedNumber
  features/tracker/          Daily Tracker (WeekStrip, DaySummary, ExerciseEntryCard, ExercisePicker)
  features/exercises/        Übungskatalog und Detail-Sheet
firestore.rules              Security Rules
```
