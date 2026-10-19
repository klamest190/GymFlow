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
2. **Authentication → Anmeldemethoden → Anonym** aktivieren. Jeder startet als Gast, ohne Registrierung.
3. **Authentication → Anmeldemethoden → Google** aktivieren. Damit lässt sich das Gastkonto im Profil-Tab per „Mit Google sichern“ verknüpfen, und die Daten bleiben bei einem Gerätewechsel erhalten. Für eine eigene Domain diese unter *Authentication → Einstellungen → Autorisierte Domains* eintragen.
4. Security Rules deployen: `npx firebase-tools deploy --only firestore:rules`

## Übungskatalog

GymFlow hat einen **festen Übungskatalog** in [src/data/exercises.ts](src/data/exercises.ts). Nutzer können keine eigenen Übungen anlegen, bearbeiten oder löschen. Dadurch ist jede Übung exakt den richtigen Muskelgruppen zugeordnet, und die Statistiken bleiben verlässlich. Der Katalog liegt nicht in Firestore: Er kostet keine Reads, funktioniert offline und wird mit der App versioniert.

**Neue Übung hinzufügen**: Eintrag im Array `DEFINITIONS` mit neuer, eindeutiger Slug-ID ergänzen (z. B. `cable-rows`). IDs bestehender Übungen **nie ändern oder wiederverwenden**, denn gespeicherte Trainings referenzieren sie.

Felder: `id`, `name`, `description`, `instructions`, `formCues[]`, `primaryMuscle`, `secondaryMuscles[]`, `category`, `equipment`, `difficulty`, `usesWeight`, `defaultSets`, `defaultReps`, `aliases[]` (Suchbegriffe).

## Firestore-Schema

```
users/{uid}                               Profil: { weeklyGoalDays: 1–7, updatedAt }
users/{uid}/workout_logs/{YYYY-MM-DD}     Genau ein Dokument pro Trainingstag
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

## PWA

GymFlow lässt sich als App installieren: über `public/manifest.webmanifest` mit Icons und einen Service Worker (`public/sw.js`, nur im Production-Build registriert), der die App-Hülle offline bereithält. Die Trainingsdaten selbst puffert Firestore offline. Die Installation setzt HTTPS voraus, also gehostet z. B. über Firebase Hosting oder Vercel.

## Struktur

```
src/
  types/models.ts            Domain-Typen (Exercise, WorkoutLog, …)
  data/exercises.ts          Fester Übungskatalog inkl. Ausführungserklärungen
  data/muscleGroups.ts       Labels & Farben
  services/                  Repository-Interface + Firestore- und localStorage-Implementierung
  lib/stats.ts               Auswertungen für das Dashboard
  lib/pwa.ts                 Service-Worker-Registrierung, Install-Prompt
  hooks/                     useLogsInRange, useProfile, useAccount, useDayDraft, useTheme
  components/                AppShell (Sidebar/TabBar), Sheet, SegmentedControl, NumberStepper, AnimatedNumber
  features/tracker/          Daily Tracker (WeekStrip, DaySummary, ExerciseEntryCard, ExercisePicker)
  features/exercises/        Übungskatalog und Detail-Sheet
  features/stats/            Statistik-Dashboard (Recharts, lazy geladen)
  features/profile/          Profil: Konto/Google, Wochenziel, Darstellung, App installieren
public/                      Manifest, Icons, Service Worker
firestore.rules              Security Rules
```
