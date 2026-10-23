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
3. Security Rules deployen: `npx firebase-tools deploy --only firestore:rules`
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

- **Geschlossenes System:** Login nur mit E-Mail und Passwort, und es gibt keine Registrierungsseite. Konten legt ausschließlich ein Admin im Admin-Bereich an. Dafür nutzt die App eine zweite, unsichtbare Firebase-Instanz, damit der Admin angemeldet bleibt.
- **Zugriff:** Firebase Auth weist nur die Identität nach. Zugriff auf Daten gibt es erst, wenn das Dokument `users/{uid}` existiert und `status: 'active'` hat. Das prüfen die Security Rules bei jeder Anfrage. Wer sich über die öffentliche Firebase-API selbst registriert, hat daher keinen Zugriff.
- **Rollen** (`role: 'admin' | 'user'`) stehen im selben Dokument. Niemand kann die eigene Rolle oder den eigenen Status ändern, damit sich auch kein Admin aussperrt. Im Client steuert die Rolle nur, was angezeigt wird. Durchgesetzt wird sie von den Rules.
- **Sperren** setzt `status: 'disabled'`. Die Sperre wirkt sofort, auch in bereits offenen Sitzungen, weil das Konto-Dokument live abonniert wird.
- **Löschen** entfernt das Konto-Dokument und alle Trainingsdaten. Den Login selbst kann man im kostenlosen Spark-Tarif nur in der Firebase Console löschen (Authentication → Nutzer). Er hat ohne Konto-Dokument aber keinerlei Zugriff mehr.
- **Passwort vergessen / ändern:** über Firebases Reset-Mail mit deutscher Vorlage, erreichbar über den Login-Screen, das Profil oder den Admin.

**Rechteverteilung** (umgesetzt in [firestore.rules](firestore.rules), geprüft mit `npm run test:rules`):

| Daten | Nutzer (aktiv) | Nutzer (gesperrt) | Admin | Login ohne Konto |
|---|---|---|---|---|
| eigenes `users/{uid}` | lesen; nur `weeklyGoalDays`/`lastLoginAt` und die XP-Felder ändern | lesen | lesen; Name ändern | (fehlt) lesen |
| fremde `users/{uid}` | – | – | lesen, anlegen, Name/Rolle/Status ändern, löschen (XP **nie**) | – |
| eigene `workout_logs` | lesen, schreiben, löschen | – | lesen, schreiben, löschen | – |
| fremde `workout_logs` | – | – | lesen und löschen (für Kontolöschung), **nie** schreiben | – |
| `exercises` | gibt es nicht: fester Katalog im Code | | | |

### Rules testen

```bash
npm run test:rules
```

Startet den Firestore-Emulator mit dem Projekt `demo-gymflow`, ohne Zugriff auf echte Daten, und prüft 63 Fälle über alle Rollen hinweg. Voraussetzungen: Firebase CLI und Java 21+ im PATH.

## Übungskatalog

GymFlow hat einen **festen Übungskatalog** in [src/data/exercises.ts](src/data/exercises.ts). Nutzer können keine eigenen Übungen anlegen, bearbeiten oder löschen. Dadurch ist jede Übung exakt den richtigen Muskelgruppen zugeordnet, und die Statistiken bleiben verlässlich. Der Katalog liegt nicht in Firestore: Er kostet keine Reads, funktioniert offline und wird mit der App versioniert.

**Neue Übung hinzufügen**: Eintrag im Array `DEFINITIONS` mit neuer, eindeutiger Slug-ID ergänzen (z. B. `cable-rows`). IDs bestehender Übungen **nie ändern oder wiederverwenden**, denn gespeicherte Trainings referenzieren sie.

Felder: `id`, `name`, `description`, `instructions`, `formCues[]`, `primaryMuscle`, `secondaryMuscles[]`, `category`, `equipment`, `difficulty`, `usesWeight`, `defaultSets`, `defaultReps`, `aliases[]` (Suchbegriffe).

## Firestore-Schema

```
users/{uid}                               Konto: Rolle, Status, Profil
users/{uid}/workout_logs/{YYYY-MM-DD}     Genau ein Dokument pro Trainingstag
```

**`users/{uid}`** (Dokument-ID = Firebase-Auth-UID):
```jsonc
{
  "email": "anna@example.de",     // vom Admin beim Anlegen gesetzt, unveränderlich
  "displayName": "Anna Schneider",
  "role": "user",                 // "admin" | "user", nur ein anderer Admin darf es ändern
  "status": "active",             // "active" | "disabled", nur ein anderer Admin darf es ändern
  "weeklyGoalDays": 3,            // 1–7, vom Nutzer selbst änderbar
  "createdAt": Timestamp, "createdBy": "admin-uid", "updatedAt": Timestamp,
  "lastLoginAt": Timestamp,       // für „Zuletzt aktiv“ in der Nutzerverwaltung

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

- **XP:** 15 pro Satz, 150 pro Workout (= Trainingstag mit mindestens einem Satz), 500 Bonus an jedem 3. Tag am Stück (Tag 3, 6, 9, … einer Serie).
- **Level:** Für den Schritt von Level `n` auf `n + 1` braucht es `floor(100 · n^1,1)` XP (100, 214, 334, …). Bei rund 450 XP pro Workout und 3–4 Workouts pro Woche heißt das: Bronze nach ~12 Workouts, Silber nach ~54, Gold nach ~1,3 Jahren, Platin nach ~3, Diamant nach ~5,7 und Grandmaster nach ~9 Jahren. Die ursprünglich vorgesehene Kurve `500 · n^1,5` hätte für Gold ~4.400 Workouts gebraucht. Die Konstanten stehen oben in `gamificationService.ts`.
- **Ränge:** Eisen (1–9), Bronze (10–19), Silber (20–39), Gold (40–59), Platin (60–79), Diamant (80–99), Grandmaster (ab 100).
- **Abgeleitet statt vergeben:** XP werden bei jeder Änderung aus der gesamten Trainingshistorie neu berechnet, nicht pro Aktion aufaddiert. Weil Trainingstage bearbeitbar sind, ließen sich XP sonst durch Löschen und erneutes Anlegen von Sätzen farmen, und Korrekturen an alten Tagen würden sie verfälschen. Wer Sätze löscht, verliert die XP dafür wieder. Erfolge bleiben dagegen dauerhaft freigeschaltet.
- **Sync:** Der `GamificationProvider` lädt alle Trainingstage (ein kleines Dokument pro Tag), berechnet den Stand und spiegelt ihn in `users/{uid}`. Bei einem Level-Up, neuen Rang oder Erfolg erscheint ein Toast. Der erste Sync eines Kontos mit bestehender Historie läuft still, damit nicht alles auf einmal gefeiert wird.
- **Grenze ohne Server:** Die Rules prüfen nur Form und Plausibilität der XP-Felder. Da der Client sie berechnet, könnte ein manipulierter Client sich eigene XP schreiben, aber nie die eines anderen. Für eine Rangliste müsste die Berechnung in eine Cloud Function (Blaze-Tarif).

## PWA

GymFlow lässt sich als App installieren: über `public/manifest.webmanifest` mit Icons und einen Service Worker (`public/sw.js`, nur im Production-Build registriert), der die App-Hülle offline bereithält. Die Trainingsdaten selbst puffert Firestore offline. Die Installation setzt HTTPS voraus, also gehostet z. B. über Firebase Hosting oder Vercel.

## Struktur

```
src/
  types/models.ts            Domain-Typen (Exercise, WorkoutLog, …)
  data/exercises.ts          Fester Übungskatalog inkl. Ausführungserklärungen
  data/muscleGroups.ts       Labels & Farben
  data/ranks.ts              Ränge (Ligen) mit Level-Schwellen, Farben, Icons
  data/achievements.ts       Erfolge (Schwellenwerte auf Trainingskennzahlen)
  services/                  Repository-Interface + Firestore- und localStorage-Implementierung
  services/gamificationService.ts  XP-Kurve, Level, Rang, Erfolge, Level-Up-Erkennung
  lib/stats.ts               Auswertungen für das Dashboard
  lib/pwa.ts                 Service-Worker-Registrierung, Install-Prompt
  lib/passwords.ts           Sichere Startpasswörter für neue Konten
  auth/                      AuthProvider, useAuth/useSession, deutsche Fehlermeldungen
  hooks/                     useLogsInRange, useAllLogs, useAllUsers, useDayDraft, useTheme
  components/                AppShell (Sidebar/TabBar), Sheet, Toasts, SegmentedControl, NumberStepper, AnimatedNumber
  features/tracker/          Daily Tracker (WeekStrip, DaySummary, ExerciseEntryCard, ExercisePicker)
  features/exercises/        Übungskatalog und Detail-Sheet
  features/stats/            Statistik-Dashboard (Recharts, lazy geladen)
  features/auth/             Login-Screen (inkl. Passwort vergessen), Kein-Zugang-Screen
  features/admin/            Nutzerverwaltung: Liste (mit Level), Anlegen, Bearbeiten, Sperren, Löschen
  features/gamification/     GamificationProvider (Sync + Toasts), GamificationDashboard (Level, Rang, Erfolge), RankBadge/LevelBadge
  features/profile/          Profil: Konto, Level & Erfolge, Passwort ändern, Wochenziel, Darstellung, App installieren
public/                      Manifest, Icons, Service Worker
firestore.rules              Security Rules (RBAC)
tests/                       Rules-Tests gegen den Firestore-Emulator
```
