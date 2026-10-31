# GymFlow: Stand & nächste Schritte

Stand: 31.10.2026. Teilprojekt 2 (Kernablauf im Training) umgesetzt: „Satz hinzufügen“ mit Werten vom letzten Mal, „Satz abhaken“, Satz-Timer. Der Test auf dem iPhone steht noch aus (siehe „Offen: Kernablauf auf dem iPhone prüfen“). GymFlow läuft auf **Vercel** unter https://gym-flow-alpha-six.vercel.app (automatischer Deploy bei jedem Push auf `main`, echte Firebase-Config, am 30.10. geprüft). **Die Rules seit dem 23.10. sind noch nicht deployt** (siehe „Offen: Auf das Handy bringen“).

## Ziel und Roadmap (festgelegt am 30.10.)

**Ziel:** GymFlow wird zur App, die Karsten selbst beim Training nutzt, **zu Hause, nur mit Kurzhanteln**. 9/10 heißt: im Training selbstverständlich zur App greifen statt zu Notizen, ein Satz ist in Sekunden mit einer Hand eingetragen. Admin und Nutzerverwaltung bleiben, wie sie sind.

Einschätzung am 30.10.: als Code etwa 7,5/10, als Produkt etwa 5/10, weil die App noch nie im echten Training benutzt wurde.

| # | Teilprojekt | Status |
|---|---|---|
| 1 | **Auf das Handy bringen:** Rules, Console, PWA installieren, Live-Test | 🔄 Hosting läuft (Vercel), Rules-Deploy und Live-Test offen |
| 2 | **Kernablauf im Training:** Werte vom letzten Mal je Übung, Satz-Timer, Satz mit einem Tipp übernehmen. Steigerungsziele bewusst weggelassen (entschieden am 31.10.) | ✅ umgesetzt am 31.10., Test auf dem iPhone offen |
| 3 | **Katalog für Kurzhanteln ergänzen:** einarmiges Rudern, vorgebeugtes Rudern, Reverse Flys, rumänisches Kreuzheben, Trizeps-Überkopfdrücken, Hammer-Curls, optional Wadenheben (je eine 3D-Pose) | offen |
| 4 | **Nachschärfen nach zwei Wochen echter Nutzung** | offen |

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
| **Ruhigere Oberfläche** (23.10.) | ✅ Sidebar springt beim Tab-Wechsel nicht mehr (`scrollbar-gutter`), Tabs werden im Hintergrund vorgeladen, Skeletons nur bei spürbarer Ladezeit (`Loadable`) |
| **Übungs-Animationen** (23.10.) | ✅ Animierte Vektor-Figur für alle 11 Übungen: Zielmuskel neongrün, Tempo mit langsamer exzentrischer Phase, Hell/Dunkel. Katalog: Standbild, Bewegung beim Hovern. Detailansicht: Schleife mit Legende und Pause |
| **3D-Animationen** (24.10.) | ✅ Figuren in echtem 3D: perspektivische Kamera, Schattierung, Tiefen-Abblendung, Bodenschatten. Pro Übung ein schräger Standard-Blickwinkel; in der Detailansicht frei drehbar (Ziehen/Pfeiltasten) mit den Ansichten Schräg, Vorne und Seite |
| **Kurzhanteln & Zeichenreihenfolge** (24.10.) | ✅ Alle 11 Übungen mit zwei kleinen Kurzhanteln, in Animation und Katalog (Ausrüstung, Texte; Lunges, Crunches und Russian Twists jetzt mit Gewicht). Kein Flackern mehr zwischen Hand und Hantel; Gelenke und Bauch/Brust wechseln die Reihenfolge ohne sichtbaren Sprung; Regressionstest gegen Flackern |
| **Gewicht je Hantel & XP** (24.10.) | ✅ Eingabe „kg je Hantel“ (±1 kg); Volumen zählt beide Hanteln (alte Einträge bleiben Gesamtgewicht); Gewichts-Bonus +1 XP je 20 kg Volumen, max. 15 je Satz, eigene Kachel im Profil und in der Einführung; CSV mit Spalte „Gewicht gilt“ |
| **Hantelgewicht im Profil** (25.10.) | ✅ Karte „Meine Kurzhanteln“ (Standard 5 kg): neue Übungen starten mit diesem Gewicht je Hantel, pro Satz weiter änderbar. Rules erlauben `dumbbellKg` (0,5–50) dem Nutzer selbst; **Rules-Deploy nötig** |
| **Einführung** (24.10.) | ✅ Tour in 5 Schritten beim ersten Start, mit Wochenziel-Auswahl. Abschluss in `users/{uid}.onboardingCompletedAt` (Serverzeit, nur einmal setzbar), erneut ansehen im Profil |
| **Tests & CI** (24.10.) | ✅ 90 Unit-Tests mit Vitest (`npm test`), 93 Rules-Tests; GitHub Action für Lint, Tests, Build und Rules. Ein Test fand einen Fehler in der Heatmap: Die dunkelste Stufe war bei wenigen Trainingstagen unerreichbar (behoben) |
| **Ladezeit** (24.10.) | ✅ Start 363 → 344 KB gzip: Framer Motion per `LazyMotion`, Firebase Auth ohne Popup-Code |
| **Motivation & Komfort** (24.10.) | ✅ Reward-Toast bei neuer Bestleistung; Vorlagen (4 mitgeliefert + eigene aus einem Tag speichern); Wochenrückblick Mo–Mi auf „Heute“; Körpergewicht mit 90-Tage-Verlauf im Profil; CSV-Export für Training und Körpergewicht. Jetzt 121 Unit-Tests und 109 Rules-Tests |
| **Design „Eisen“** (25.10.) | ✅ Neue visuelle Identität statt Neon-Lime mit Glas (Regeln siehe „Design-Regeln“ unten). „Heute“ als Satz-Protokoll mit großen Zahlen und einem aufgeklappten Satz; Statistik mit Wochenziel als Scheiben-Balken; Profil in die Abschnitte Training und App gegliedert; Login mit 3D-Figur; neue App-Icons. Behoben: Übungskarten zuckten und glitten beim Hovern seitlich (volle Layout-Animation plus Hover-Lift). Kontraste aller Farbpaare geprüft, Tastatur-Fokus überall sichtbar |
| **Kleinerer Start & XP am Folgetag** (25.10.) | ✅ Neue Übungen starten mit 1 Satz × 10 Wdh. (Katalogwerte heißen jetzt „Empfohlen“). XP, Level und Erfolge zählen nur abgeschlossene Tage; der laufende Tag zeigt „+X XP für heute“ im Tracker und im Profil und wird am nächsten Tag gutgeschrieben (mit Toast). Versehentlich angelegte und wieder gelöschte Übungen bringen so nichts mehr |
| **Kernablauf im Training** (31.10.) | ✅ Neue Übungen haben 0 Sätze. „Satz hinzufügen“ öffnet den nächsten Satz mit Satz n vom letzten Mal in den Steppern, „Satz abhaken“ speichert ihn (vorher nur Entwurf). Zuerst als grauer Vorschau-Satz mit ✓ gebaut, auf Wunsch am 31.10. durch den expliziten Button ersetzt (zwei Tipps pro Satz, dafür eindeutig). „Letztes Mal: 12, 10, 8 Wdh. mit 8 kg“ unter dem Namen. Satz-Timer nach jedem Satz von heute: Leiste auf allen Tabs, ±15 s, Überzeit, Ton, Bildschirm bleibt an; Pausenzeit im Profil (pro Gerät). Vorlagen setzen nur noch Übungen, ihre Werte füllen die Vorschau ohne Historie. Statistik, Heatmap und Wochenstreifen zählen nur Tage mit Sätzen. Keine Rules-Änderung nötig. 186 Unit-Tests |

### Behobener Fehler (19.10.)

Beim allerersten Start eines neuen Nutzers erzeugte die App zwei anonyme Konten, weil `signIn()` doppelt lief (React StrictMode). Danach merkte sie sich das falsche, und Firestore lehnte alle Lese- und Schreibzugriffe ab, bis die Seite neu geladen wurde. `signIn()` war danach idempotent. Das Gast-Login wurde inzwischen durch E-Mail/Passwort ersetzt; der `AuthProvider` legt keine Konten mehr selbst an, damit kann der Fehler nicht wieder auftreten.

## Offen: Kernablauf auf dem iPhone prüfen (Teilprojekt 2)

- [ ] Ein Training mit der installierten App machen und dabei prüfen:
  - Ist der **Ton am Pausenende** zu hören, auch bei stummgeschaltetem iPhone und mit laufender Musik? (`navigator.audioSession.type = 'transient'` in `src/lib/sound.ts`; falls stumm, `'playback'` probieren, das stoppt aber Musik.)
  - Bleibt der **Bildschirm während der Pause an** (Wake Lock; im Stromsparmodus verweigert iOS ihn)?
  - Stimmt die Pause nach **Sperren und Entsperren** des Handys?
- [ ] Alles notieren, was im echten Training stört: Grundlage für Teilprojekt 4.

## Offen: Auf das Handy bringen (Teilprojekt 1)

- [ ] **Rules deployen** (selbst ausführen, Claude darf nicht in Produktion deployen; die App selbst deployt Vercel automatisch):
  ```bash
  npx firebase-tools deploy --only firestore:rules --project gymflow-917db
  ```
  Bis dahin klappen Login per Benutzername und das Anlegen neuer Nutzer nicht, die Einführung kann ihren Abschluss nicht speichern (sie käme bei jedem Start wieder), eigene Vorlagen, Körpergewicht und das Hantelgewicht im Profil lassen sich nicht speichern.
- [ ] **CI prüfen:** nach dem ersten Push unter GitHub → Actions nachsehen, ob beide Jobs grün sind.
- [ ] **Eigenen Benutzernamen setzen:** Admin → eigenes Konto öffnen → „Benutzername“. Bestehende Konten haben noch keinen.

## Offen: nur in der Firebase Console möglich (sonst kann sich niemand anmelden)

- [ ] **E-Mail/Passwort aktivieren:** Authentication → Anmeldemethoden → E-Mail/Passwort.
- [ ] **Anonym und Google deaktivieren:** werden nicht mehr genutzt.
- [ ] **Ersten Admin anlegen.** Anleitung mit Feldtabelle in `README.md` → „Einmalig in der Firebase Console“, Punkt 4:
  1. Authentication → Nutzer hinzufügen
  2. Firestore → `users/{UID}` mit `role: admin`, `status: active`
- [ ] Danach: **Live-Test** auf https://gym-flow-alpha-six.vercel.app mit dem Admin. Einen Testnutzer anlegen, mit ihm anmelden, sperren und prüfen, dass er sofort ausgesperrt ist.
- [ ] **Auf dem Handy:** die Adresse öffnen, anmelden, „Zum Startbildschirm hinzufügen“ bzw. „App installieren“, einen Satz eintragen, im Flugmodus erneut öffnen (App und Daten müssen da sein).
- [ ] Optional: alte anonyme Test-Gastkonten unter Authentication → Nutzer löschen. Sie haben keinen Zugriff mehr.

## Offen: lokal

- [ ] **Ordner umbenennen** von `gymflow` in `GymFlow`. Das geht nur bei geschlossenem VS Code. Die Git-Verbindung bleibt erhalten.

## Grenzen ohne Server (kostenloser Spark-Tarif, bewusst so gewählt)

- Beim Löschen eines Nutzers bleibt der Login in Firebase Auth bestehen. Er hat aber keinerlei Zugriff, weil das Konto-Dokument fehlt. Endgültig löschen lässt er sich in der Console. Soll dieselbe E-Mail neu angelegt werden, muss der alte Login vorher dort entfernt werden.
- Über die öffentliche Firebase-API kann sich technisch jeder einen Login anlegen. Ohne vom Admin erstelltes Konto-Dokument bekommt er aber keinen Datenzugriff (getestet).
- Mit Cloud Functions (Blaze-Tarif) ließen sich Logins echt sperren und löschen und Rollen als Custom Claims führen. Das ist ein späterer Ausbau, falls nötig.

## Ideen für danach (optional)

- **Katalog erweitern** (siehe Teilprojekt 3): Neue Einträge kommen in `DEFINITIONS` in `src/data/exercises.ts`, bestehende IDs nie ändern. Für die Animation zusätzlich eine Pose in `src/features/exercises/animation/poses.ts` anlegen.

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
- **XP erst für abgeschlossene Tage** (entschieden am 25.10.): Der heutige Tag zählt erst ab morgen, damit Fehleingaben keine XP und keine dauerhaften Erfolge auslösen. Nachträge an vergangenen Tagen zählen sofort.
- **Gespeichert wird nur, was gemacht wurde** (entschieden am 31.10.): Der nächste Satz ist bis zum Abhaken nur ein Entwurf mit berechneten Startwerten, kein gespeicherter „geplanter“ Satz. Verworfen: ein Feld `done` pro Satz (hätte alle ~14 Auswertungen betroffen, vergessene Haken fehlen in der Statistik) und „Satz fertig“ legt den nächsten an (übrig bleibender Geistersatz).
- **Keine Steigerungsziele** (entschieden am 31.10.): Die App zeigt das letzte Mal und übernimmt dessen Werte, gibt aber kein „Ziel: +1“ vor.
- **Pausenzeit eine für alles, pro Gerät** (entschieden am 31.10.): in `localStorage` wie das Farbschema, keine Rules-Änderung. Timer nur für heute, nicht beim Nachtragen.
- **Design „Eisen“ statt Neongrün mit Glas** (entschieden am 25.10.): Das alte Design war sauber gebaut, sah aber aus wie viele generierte Apps. Die neue Identität kommt aus der Welt der Hantelscheiben. Verworfen: Lime behalten und nur entrümpeln („Evolution“), und ein Papier-Trainingsheft (zu weit weg vom Studio).

## Design-Regeln

Damit neue Screens im Stil bleiben. Tokens in `src/index.css`, Bewegung in `src/lib/motion.ts`.

- **Farben:** Kreide-Grund `#e8eae7`, Graphit-Text, Stahl-Flächen. **Ein Akzent: Scheiben-Gelb `#f2c200`**, nur als Fläche. Als Text immer `text-accent-fg` (dunkles Senf im hellen Modus), als kleine Markierung ohne Text daneben `bg-accent-mark` (≥ 3:1). Rote Flächen mit weißem Inhalt nutzen `bg-danger-fill`.
- **Graphit heißt Auswahl, Gelb heißt Aktion oder Fortschritt.** Gewählte Tage, Filter und Segmente sind `bg-fg text-bg`. Gelb tragen nur Haupt-Buttons, der FAB, Fortschrittsbalken, Trainingstage und der aktive Tab-Strich. Pro Screen höchstens eine gelbe Fläche, die ins Auge springt.
- **Muskelgruppen** sind nach vier Körperregionen eingefärbt (Drücken, Ziehen, Rumpf, Beine) in Wettkampf-Scheibenfarben, immer mit dem Namen daneben. Zwölf eigene Farben wären nicht unterscheidbar. Neue Farben vorher mit dem Paletten-Validator prüfen (Farbenblindheit, Kontrast).
- **Schrift:** nur Archivo. `headline` für Titel (schmal, fett), `numeral` für Zahlen (noch schmaler, gestanzt), sonst normale Breite. Labels in normaler Schreibung, keine GROSSBUCHSTABEN mit Sperrung, keine Ketten mit Mittelpunkten („A · B · C“), sondern Sätze oder Kommas.
- **Flächen:** massiv, kein Glas, kein Glow. Radien nach Rang: Flächen 20 px (`rounded-3xl`), Steuerelemente 12 px (`rounded-xl`), Sheets 28 px. Pillenform nur für Filter und Chips. Nicht alles ist eine Karte: Zusammenfassungen stehen direkt auf dem Grund, Einstellungen als Zeilen (`SettingsList`/`SettingRow`).
- **Einziges Ornament:** das Rändelmuster (`knurl`) wie am Hantelgriff, nur am aktiven Satz, am Wochenziel und am XP-Balken.
- **Bewegung:** nur die Presets `snap` (Reaktion auf Tipp), `settle` (Umstellungen), `fade`, `reveal` (Aufklappen). Keine Federn, die nachwippen, keine gestaffelten Einblendungen, kein Hover-Lift. Nur `transform` und `opacity` animieren; `layout="position"` statt vollem `layout`, sonst verzerren Karten oder springen beim Neu-Rendern. `MotionConfig reducedMotion="user"` respektiert „Bewegung reduzieren“.
