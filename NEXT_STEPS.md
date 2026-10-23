# GymFlow: Stand & nächste Schritte

Stand: 23.10.2026 · Benutzername-Login umgesetzt, **Rules dafür noch nicht deployt** · Einrichtung in der Firebase Console steht noch aus

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
| Profil-Tab | ✅ Konto (Name, E-Mail, Rolle), Passwort ändern, Abmelden, Wochenziel 1–7, Hell/Dunkel/System, „App installieren“ |
| Firestore-Rules deployt | ✅ 19.10. (inkl. Validierung des Profils) |
| Live-Test mit Firebase | ✅ 19.10. mit dem damaligen Gast-Login; für das neue E-Mail-Login steht er noch aus (siehe unten) |
| Bundle verkleinern | ✅ Tabs lazy geladen (Recharts nur in der Statistik), Firebase/React/Motion als eigene, lange cachebare Chunks |
| PWA | ✅ Manifest, App-Icons, Service Worker (Offline-App-Hülle) |
| GitHub | ✅ https://github.com/klamest190/GymFlow |
| **Briefing v2:** E-Mail/Passwort-Login ohne Registrierung | ✅ Login-Screen mit „Passwort vergessen“, deutsche Fehlermeldungen |
| **Briefing v2:** Rollen admin/user | ✅ im Dokument `users/{uid}`, durchgesetzt von den Security Rules (48 Tests, `npm run test:rules`), deployt am 19.10. |
| **Briefing v2:** Admin-Panel | ✅ Tab „Admin“: Nutzer anlegen (mit Startpasswort und Reset-Mail), Name/Rolle ändern, sperren, löschen |
| **Briefing v2:** Custom Exercises | ❌ weiterhin bewusst nicht: fester Katalog (bestätigt am 19.10.) |
| **Premium-Feinschliff** (23.10.) | ✅ Übungen: Skeletons, Hover-Lift mit Schatten, neongrüne Filter-Pills, leerer Zustand mit „Filter zurücksetzen“. Statistik: Trend-Badges für Wdh./Sätze/Volumen, Glas-Tooltip mit Vorwochenvergleich, Heatmap-Tooltips, Linie zeichnet sich ein, Übungs-Dropdown. Daten-Hooks `useExercises` und `useWorkoutStats` |
| **Level & Erfolge** (23.10.) | ✅ XP-Kurve `floor(100 · n^1,1)` (statt der vorgegebenen `500 · n^1,5`, siehe README), Level-Spalte und Level-Details in der Nutzerverwaltung, 7 Ränge Eisen bis Grandmaster, 8 Erfolge, Reward-Toasts bei Level-Up/neuem Rang/Erfolg, Dashboard im Profil. XP werden aus der Historie abgeleitet und in `users/{uid}` gespiegelt. Rules erweitert, 63 Tests grün, deployt am 23.10. |
| **Benutzername-Login** (23.10.) | ✅ Login mit Benutzername oder E-Mail (auch „Passwort vergessen“). Admin vergibt den Benutzernamen beim Anlegen (Vorschlag aus dem Namen) und kann ihn in der Nutzerverwaltung setzen/ändern. Lookup über `usernames/{name}`, Rules erweitert, 84 Tests grün |

### Behobener Fehler (19.10.)

Beim allerersten Start eines neuen Nutzers erzeugte die App zwei anonyme Konten, weil `signIn()` doppelt lief (React StrictMode). Danach merkte sie sich das falsche, und Firestore lehnte alle Lese- und Schreibzugriffe ab, bis die Seite neu geladen wurde. `signIn()` war danach idempotent. Das Gast-Login wurde inzwischen durch E-Mail/Passwort ersetzt; der `AuthProvider` legt keine Konten mehr selbst an, damit kann der Fehler nicht wieder auftreten.

## Offen: Benutzername-Login

- [ ] **Rules deployen:** `firebase deploy --only firestore:rules --project gymflow-917db`. Bis dahin klappt der Login nur per E-Mail, und das Anlegen neuer Nutzer schlägt fehl (die Rules kennen das Feld `username` noch nicht).
- [ ] **Eigenen Benutzernamen setzen:** Admin → eigenes Konto öffnen → „Benutzername“. Bestehende Konten haben noch keinen.

## Offen: nur in der Firebase Console möglich (sonst kann sich niemand anmelden)

- [ ] **E-Mail/Passwort aktivieren:** Authentication → Anmeldemethoden → E-Mail/Passwort.
- [ ] **Anonym und Google deaktivieren:** werden nicht mehr genutzt.
- [ ] **Ersten Admin anlegen.** Anleitung mit Feldtabelle in `README.md` → „Einmalig in der Firebase Console“, Punkt 4:
  1. Authentication → Nutzer hinzufügen
  2. Firestore → `users/{UID}` mit `role: admin`, `status: active`
- [ ] Danach: **Live-Test** mit dem Admin. Einen Testnutzer anlegen, mit ihm anmelden, sperren und prüfen, dass er sofort ausgesperrt ist.
- [ ] Optional: alte anonyme Test-Gastkonten unter Authentication → Nutzer löschen. Sie haben keinen Zugriff mehr.

## Offen: lokal

- [ ] **Ordner umbenennen** von `gymflow` in `GymFlow`. Das geht nur bei geschlossenem VS Code. Die Git-Verbindung bleibt erhalten.

## Grenzen ohne Server (kostenloser Spark-Tarif, bewusst so gewählt)

- Beim Löschen eines Nutzers bleibt der Login in Firebase Auth bestehen. Er hat aber keinerlei Zugriff, weil das Konto-Dokument fehlt. Endgültig löschen lässt er sich in der Console. Soll dieselbe E-Mail neu angelegt werden, muss der alte Login vorher dort entfernt werden.
- Über die öffentliche Firebase-API kann sich technisch jeder einen Login anlegen. Ohne vom Admin erstelltes Konto-Dokument bekommt er aber keinen Datenzugriff (getestet).
- Mit Cloud Functions (Blaze-Tarif) ließen sich Logins echt sperren und löschen und Rollen als Custom Claims führen. Das ist ein späterer Ausbau, falls nötig.

## Ideen für danach (optional)

- **Hosting:** Für die Nutzung auf dem Handy und die PWA-Installation braucht GymFlow eine HTTPS-Adresse. Naheliegend ist Firebase Hosting im selben Projekt: `firebase.json` um `hosting` mit `dist` und SPA-Rewrite ergänzen, dann `npm run build && npx firebase-tools deploy --only hosting`. Die Domain anschließend bei den autorisierten Domains eintragen.
- **Katalog erweitern:** Bisher gibt es keine reine Rückenübung (z. B. Rudern, Klimmzüge, Latzug). Neue Einträge kommen in `DEFINITIONS` in `src/data/exercises.ts`, bestehende IDs nie ändern.
- Satz-Timer (Pausenzeit zwischen Sätzen) im Tracker
- Export der Trainingsdaten (CSV)

## Getroffene Entscheidungen

- **Fester Übungskatalog, keine eigenen Übungen.** Die Muskelgruppen-Zuordnung bleibt exakt.
- **„Weites/Enges Brustrücken“** ist umgesetzt als Bankdrücken mit weitem bzw. engem Griff.
- **Firestore enthält nur Nutzerdaten:** `users/{uid}` (Konto mit Rolle/Status/Wochenziel) und `users/{uid}/workout_logs/{YYYY-MM-DD}`.
- **Geschlossenes System ohne Server:** Rollen und Status im Konto-Dokument statt Custom Claims, Nutzer-Anlage über eine zweite Firebase-Instanz im Admin-Client.
- **Muskelverteilung in Sätzen** (nicht in Wiederholungen); Hilfsmuskeln zählen umschaltbar mit ½.
- **Heatmap-Stufen nach Quartilen** der eigenen Trainingstage, damit sie für Einsteiger wie Fortgeschrittene aussagekräftig ist.
- **Farbschema pro Gerät** (localStorage), nicht synchronisiert.
- **Benutzername zusätzlich zur E-Mail** (entschieden am 23.10.): E-Mail bleibt Pflicht, damit „Passwort vergessen“ immer funktioniert. In Kauf genommen: Wer einen Benutzernamen kennt, kann die zugehörige E-Mail abfragen (öffentlicher Lookup vor dem Login, ohne Cloud Functions nicht vermeidbar).
- **XP abgeleitet statt pro Aktion vergeben:** Trainingstage sind bearbeitbar, also wird alles aus der Historie neu berechnet (nicht farmbar, geräteübergreifend gleich). Ein „abgeschlossenes Workout“ ist ein Trainingstag mit mindestens einem Satz. Den 3-Tage-Streak-Bonus gibt es an jedem 3. Tag einer Serie. Erfolge bleiben auch nach dem Löschen von Tagen freigeschaltet, XP nicht.
- Akzentfarbe Neongrün (im Light Mode in Diagrammen dunkler, wegen des Kontrasts), Schrift Inter, Design im Apple-Stil mit Glassmorphism.
