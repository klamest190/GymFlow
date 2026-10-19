# GymFlow: Stand & nächste Schritte

Stand: 19.10.2026 · alle Punkte aus dem ursprünglichen Briefing sind umgesetzt

## Weitermachen

```bash
cd C:\Users\klame\Documents\Antigravity\gymflow
npm install        # nur nötig auf einem neuen Rechner / nach frischem Clone
npm run dev
```

- `.env.local` mit der Firebase-Config muss vorhanden sein (nicht im Git, Vorlage: `.env.example`). Ohne sie startet die App im Demo-Modus.
- Für Claude reicht als Einstieg: **„Lies NEXT_STEPS.md und mach mit den offenen Punkten weiter.“**

## Erledigt

| Briefing / Roadmap | Status |
|---|---|
| Firestore-Schema, TypeScript-Interfaces | ✅ `src/types/models.ts`, Schema in `README.md` |
| Standard-Übungen mit Ausführungserklärungen | ✅ 11 Übungen in `src/data/exercises.ts` |
| 1. Übungs-Katalog | ✅ Tab „Übungen“ |
| 2. Custom Exercises | ❌ **Bewusst verworfen.** Nur der feste Katalog, damit die Muskelgruppen exakt bleiben |
| 3. Daily Workout Tracker | ✅ Tab „Heute“ |
| 4. Analytics & Dashboard | ✅ Tab „Statistik“: Wochen-KPIs mit Zielring, Säulen pro Woche, Muskelgruppen, Aktivitäts-Heatmap, Fortschritt pro Übung, Bestleistungen |
| Profil-Tab | ✅ Konto mit Google sichern, Wochenziel 1–7, Hell/Dunkel/System, „App installieren“ |
| Firestore-Rules deployt | ✅ 19.10. (inkl. Validierung des Profils) |
| Live-Test mit Firebase | ✅ 19.10.: Anmeldung, Speichern, Profil, Statistik, Löschen bestanden |
| Bundle verkleinern | ✅ Tabs lazy geladen (Recharts nur in der Statistik), Firebase/React/Motion als eigene, lange cachebare Chunks |
| PWA | ✅ Manifest, App-Icons, Service Worker (Offline-App-Hülle) |
| GitHub | ✅ https://github.com/klamest190/GymFlow |

### Behobener Fehler (19.10.)

Beim allerersten Start eines neuen Nutzers erzeugte die App zwei anonyme Konten, weil `signIn()` doppelt lief (React StrictMode). Danach merkte sie sich das falsche, und Firestore lehnte alle Lese- und Schreibzugriffe ab, bis die Seite neu geladen wurde. `signIn()` ist jetzt idempotent.

## Offen: nur in der Firebase Console möglich

- [ ] **Google-Anmeldung aktivieren:** Authentication → Anmeldemethoden → Google → aktivieren. Ohne das zeigt „Mit Google sichern“ im Profil einen Hinweis.
- [ ] Optional: **Test-Gastkonten aufräumen.** Beim Live-Test sind rund 10 leere anonyme Nutzer entstanden (Authentication → Nutzer). Die Testdaten selbst wurden wieder gelöscht.

## Offen: lokal

- [ ] **Ordner umbenennen** von `gymflow` in `GymFlow`. Das geht nur bei geschlossenem VS Code, weil der Ordner sonst gesperrt ist. Die Git-Verbindung bleibt erhalten.

## Ideen für danach (optional)

- **Hosting:** Für die Nutzung auf dem Handy und die PWA-Installation braucht GymFlow eine HTTPS-Adresse. Naheliegend ist Firebase Hosting im selben Projekt: `firebase.json` um `hosting` mit `dist` und SPA-Rewrite ergänzen, dann `npm run build && npx firebase-tools deploy --only hosting`. Die Domain anschließend bei den autorisierten Domains eintragen.
- **Katalog erweitern:** Bisher gibt es keine reine Rückenübung (z. B. Rudern, Klimmzüge, Latzug). Neue Einträge kommen in `DEFINITIONS` in `src/data/exercises.ts`, bestehende IDs nie ändern.
- Satz-Timer (Pausenzeit zwischen Sätzen) im Tracker
- Export der Trainingsdaten (CSV)

## Getroffene Entscheidungen

- **Fester Übungskatalog, keine eigenen Übungen.** Die Muskelgruppen-Zuordnung bleibt exakt.
- **„Weites/Enges Brustrücken“** ist umgesetzt als Bankdrücken mit weitem bzw. engem Griff.
- **Firestore enthält nur Nutzerdaten:** `users/{uid}` (Wochenziel) und `users/{uid}/workout_logs/{YYYY-MM-DD}`.
- **Muskelverteilung in Sätzen** (nicht in Wiederholungen); Hilfsmuskeln zählen umschaltbar mit ½.
- **Heatmap-Stufen nach Quartilen** der eigenen Trainingstage, damit sie für Einsteiger wie Fortgeschrittene aussagekräftig ist.
- **Farbschema pro Gerät** (localStorage), nicht synchronisiert.
- Akzentfarbe Neongrün (im Light Mode in Diagrammen dunkler, wegen des Kontrasts), Schrift Inter, Design im Apple-Stil mit Glassmorphism.
