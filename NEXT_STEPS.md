# GymFlow: Stand & nächste Schritte

Stand: 18.10.2026 · letzter Commit: `Initial commit: GymFlow fitness tracker`

## Morgen weitermachen

```bash
cd C:\Users\klame\Documents\Antigravity\gymflow
npm install        # nur nötig auf einem neuen Rechner / nach frischem Clone
npm run dev
```

- `.env.local` mit der Firebase-Config muss vorhanden sein (nicht im Git, Vorlage: `.env.example`). Ohne sie startet die App im Demo-Modus.
- Für Claude reicht als Einstieg: **„Lies NEXT_STEPS.md und mach mit Schritt 1 weiter.“**

## Erledigt

Bezogen auf das ursprüngliche Briefing:

| Briefing | Status |
|---|---|
| Firestore-Schema, TypeScript-Interfaces | ✅ `src/types/models.ts`, Schema in `README.md` |
| Standard-Übungen mit Ausführungserklärungen | ✅ 11 Übungen in `src/data/exercises.ts` |
| 1. Übungs-Katalog | ✅ Tab „Übungen“: Suche, Muskelfilter, Detailansicht mit Verlauf und „Zu heute hinzufügen“ |
| 2. Custom Exercises | ❌ **Bewusst verworfen.** Es gibt nur den festen Katalog, damit die Muskelgruppen exakt bleiben. Neue Übungen werden im Code ergänzt. |
| 3. Daily Workout Tracker | ✅ Tab „Heute“: Wochenleiste, vergangene Tage, Sätze/Wdh./Gewicht, Offline-Speichern |
| 4. Analytics & Dashboard | ⏳ **offen**, siehe Schritt 1 |
| Design: Mobile-First, Desktop-Dashboard, Glassmorphism, Dark/Light, Swipe-Gesten | ✅ |
| Firebase: Anonym-Login, Firestore-DB, Rules | ✅ |
| GitHub | ✅ https://github.com/klamest190/GymFlow |

## Offene Schritte

### 1. Statistik-Dashboard (Kernfunktion 4 aus dem Briefing)

Tab „Statistik“ ersetzt den aktuellen Platzhalter (`ComingSoon` in `src/App.tsx`). Diagramme mit **Recharts** (ist schon installiert), animiert und interaktiv mit Tooltips, passend zum Dark/Light-Theme.

- **Kennzahlen oben:** Trainingstage diese Woche, Wiederholungen, Volumen (kg), aktuelle Serie (Tage/Wochen in Folge)
- **Wiederholungen pro Woche:** Balkendiagramm über die letzten 8–12 Wochen, umschaltbar auf Sätze oder Volumen
- **Aktivitäts-Heatmap:** Kalender-Raster im GitHub-Stil über die letzten ~6–12 Monate, Farbintensität nach Volumen/Wiederholungen des Tages
- **Muskelgruppen-Verteilung:** Donut- oder Radar-Chart, wählbarer Zeitraum (7 / 30 / 90 Tage)
- **Fortschritt pro Übung:** Linie für das höchste Gewicht bzw. die Wiederholungen über die Zeit
- **Layout:** Mobile als gestapelte Karten, Desktop als Dashboard-Raster mit mehreren Spalten

Die Datengrundlage ist schon vorhanden. Jedes Tagesdokument enthält voraggregierte `totals` (Sätze, Wiederholungen, Volumen) und `muscleGroupReps`. Laden über `useLogsInRange(userId, from, to)`, ein Jahr sind höchstens 365 Reads.

Vor dem Bauen klären:
- Sollen **sekundäre Muskeln** in die Verteilung einfließen (z. B. mit halbem Gewicht)? Aktuell zählt `muscleGroupReps` nur den Hauptmuskel.
- Hauptkennzahl: Wiederholungen oder Volumen (kg)?

### 2. Profil-Tab

- Hell/Dunkel/System-Theme (auf Mobile gibt es bisher nur den Toggle im Tracker-Header)
- Wochenziel (Trainingstage pro Woche) als Ring im Dashboard (`UserProfile.weeklyGoalDays` ist im Schema schon vorgesehen)
- Konto sichern: anonymes Konto per `linkWithPopup` mit Google verknüpfen, damit die Daten beim Gerätewechsel erhalten bleiben (Google-Anmeldung in der Firebase Console aktivieren)

### 3. Kleinere offene Punkte

- [ ] **Firestore-Rules neu deployen:** Die lokale Version ohne die Regel für eigene Übungen ist noch nicht live. Befehl: `npx firebase-tools deploy --only firestore`
- [ ] **Ordner umbenennen** von `gymflow` in `GymFlow`, nachdem VS Code geschlossen wurde (die Git-Verbindung bleibt erhalten)
- [ ] **Bundle verkleinern:** Das JS-Bundle ist ca. 1 MB groß, vor allem wegen Firebase. Abhilfe: Code-Splitting per `manualChunks` bzw. Lazy-Loading der Tabs
- [ ] **Live-Test mit Firebase:** Training eintragen und prüfen, ob in der Firebase Console unter `users/{uid}/workout_logs/{datum}` ein Dokument erscheint
- [ ] Optional: **PWA** (Manifest + Service Worker), damit sich GymFlow wie eine App auf dem Homescreen installieren lässt
- [ ] Optional: weitere Übungen im Katalog ergänzen (neue Einträge in `DEFINITIONS` in `src/data/exercises.ts`, bestehende IDs nie ändern)

## Getroffene Entscheidungen

- **Fester Übungskatalog, keine eigenen Übungen.** Die Muskelgruppen-Zuordnung bleibt dadurch exakt und die Statistiken verlässlich.
- **„Weites/Enges Brustrücken“** ist umgesetzt als Bankdrücken mit weitem bzw. engem Griff („Brustdrücken“).
- **Firestore enthält nur Nutzerdaten:** `users/{uid}/workout_logs/{YYYY-MM-DD}`, ein Dokument pro Trainingstag. Der Katalog liegt im Code.
- Akzentfarbe Neongrün, Schrift Inter, Design im Apple-Stil mit Glassmorphism.
