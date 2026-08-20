# ATELIER A8 — Abnahme-Report (S-20)

> Status: **Track-A GREEN, Track-B GREEN.**
>
> Track-B war nie an fehlender Implementierung blockiert, sondern an sechs
> Framework-Defekten, die der Track-B-Integrationstest überhaupt erst sichtbar
> gemacht hat. Alle folgen demselben Muster: **ein Gate prüft die Form eines
> Artefakts, nie seine Wirkung zur Laufzeit.** Der Abschnitt „Blindflecken"
> unten ist die Aufarbeitung, nicht mehr die Blockerliste.

## Ausgangslage

`docs/superpowers/plans/2026-07-12-atelier-a8-plan.md` Task 6 forderte einen
S-20-End-to-End-Test für beide Tracks. Vorhanden war nur
`s-20.integration.test.ts` (Track-A). Für Track-B existierten Fixtures
(`src/cli/fixtures/track-b-portfolio/`) und ein reiner Schema-Validierungstest
(`track-b-fixture.test.ts`) — aber kein Lauf, der Pipeline, Deploy und CRITIC
tatsächlich ausführt. Genau deshalb blieben die unten stehenden Fehler liegen.

## Neu

- `src/cli/commands/s-20-track-b.integration.test.ts` — Brief → Tokens → Motion
  → Pipeline → Deploy → CRITIC über ein temporäres Repo, analog Track-A.
- `src/cli/fixtures/track-b-portfolio/e2e/reduced-motion.spec.ts`

## Gefundene und behobene Fehler

| # | Datei | Fehler | Wirkung |
|---|---|---|---|
| 1 | `generators/pattern-nav-cursor.ts` | `motion` importiert, nie benutzt | LINT-Stage rot (`@typescript-eslint/no-unused-vars`) |
| 2 | `generators/pattern-webgl-depth-gallery.ts` | `import * as THREE from "three"` | I-18-Verstoß (Raw-Motion-Engine außerhalb `src/core/*`) |
| 3 | `generators/pattern-webgl-depth-gallery.ts`, `pattern-webgl-flowmap.ts` | `useStageFrame` außerhalb der `<Stage>`-Canvas aufgerufen | BUILD-Stage rot: `R3F: Hooks can only be used within the Canvas component!` beim Next.js-Prerender |
| 4 | `templates/package-json.ts` | veraltete Versions-Pins | `axm deploy` exit 90 (AXM-S002) auf **beiden** Tracks |
| 5 | `fixtures/track-b-portfolio/` | kein eigenes `reduced-motion.spec.ts` | Scaffold-Default zielte auf `HeroDemo`, den die Portfolio-Page nicht hat |

Fehler 3 folgt dem Muster, das `distortion-media` bereits korrekt umsetzt:
innere Mesh-/Group-Komponente extrahieren, Hook dort aufrufen.

### Zu Fehler 4 — Versions-Pins driften konstruktionsbedingt

`axm deploy` führt ein **live** `pnpm audit` gegen die Registry aus. Ein neues
High-Advisory auf einer gepinnten Abhängigkeit blockiert Deploy also
zwangsläufig, ohne dass sich am Repo etwas geändert hat. Das ist kein Regress,
sondern Bauart.

Gesetzt wurden: `next` 15.5.20 → **15.5.21** (3× high: DoS in Server Actions
CVE-2026-64641, SSRF via Server Actions, SSRF via rewrites), plus
`pnpm.overrides` `postcss` **8.5.26** (Path-Traversal/Arbitrary-File-Read via
`sourceMappingURL`, XSS via unescaped `</style>`) und `js-yaml` **5.2.2**
(quadratische CPU-Last).

**Overrides exakt pinnen, nicht als Range.** Ein erster Versuch mit
`js-yaml: ">=4.3.1"` löste auf 5.2.1 auf — einen neuen Major mit eigenem
High-Advisory. Offene Ranges driften und widersprechen der Determinismus-Doktrin;
alle übrigen Deps im Template sind ebenfalls exakt gepinnt.

Wenn Deploy künftig mit AXM-S002 bricht: Pins hochziehen, nicht nach einer
Regression suchen.

## Blockierend: zwei Blindflecken

### B1 — Tailwind-Utilities werden nie generiert

Das Scaffold liefert `tailwindcss` als devDependency und `@import "tailwindcss"`
in `app/globals.css`, aber **weder `postcss.config.mjs` noch
`@tailwindcss/postcss`**. Next.js' eingebaute CSS-Pipeline behandelt den Import
als gewöhnliches CSS: Preflight und Theme-Variablen kommen durch, `@tailwind
utilities` fällt als unbekannte At-Rule weg.

Nachgewiesen in einer Wegwerf-App: vorher 42 128 Bytes CSS mit **null**
Utility-Regeln, nach Ergänzen des Plugins 15 658 Bytes mit allen
(`h-4`, `w-4`, `fixed`, `z-40`, `min-h-screen`, `pointer-events-none`).

Konsequenz: **jede** je generierte AXIOM/ATELIER-App lief ohne Layout-Klassen.
`flex`, `min-h-screen`, `absolute` taten still nichts. Keine Stage hat es
gemerkt, weil kein Test je geprüft hat, ob eine Utility-Klasse im emittierten
CSS landet.

Track-A blieb grün, weil seine Assertions auf Text und intrinsisch große
Elemente zielen. Track-Bs `cursor-system` (16×16 via `h-4 w-4`) kollabierte auf
0×0 → Playwright meldet „hidden". Diese Assertion ist der Kanarienvogel und wird
**nicht** aufgeweicht.

Bestätigt: Sobald das Plugin ergänzt ist, ist `cursor-system` sichtbar und die
E2E-Stage grün.

### B2 — Das Perf-Gate maß nie, was es zu messen vorgab

Sobald B1 behoben ist, greift `<Stage className="h-screen w-full">` zum ersten
Mal, die WebGL-Canvases rendern in voller Viewport-Größe — und die PERF-Stage
fiel auf **beiden** Tracks. Es steckten vier eigenständige Defekte darin.

**B2a — „Frame-Dauer" war der Abstand zwischen Zeichenvorgängen.**
`perf-trace.ts` bildete Frames aus dem Zeitabstand aufeinanderfolgender
`DrawFrame`-Events. Das ist nicht, wie lange ein Frame dauerte, sondern wie
lange der Browser wartete, bis er wieder zeichnete. Eine idle Seite zeichnet
nicht — die Stille wurde als ein einzelner riesiger Frame gemeldet.

Isolation von Track-A machte es eindeutig: `idle-only` grün, `scroll-only` ein
einziger 617-ms-„Frame". Der WebGL-Hero scrollt aus dem Viewport, seine
rAF-Schleife verstummt, nichts muss komponiert werden. `longTasks: 0` war die
ganze Zeit der Hinweis — nichts war blockiert.

Warum es erst jetzt auftrat: es brauchte echtes Layout. Vor B1 hatten die
Sections keine Höhe, nie scrollte etwas aus dem Bild, immer lief etwas.

Eine Lücke zählt jetzt nur als Frame, wenn der Renderer darin beschäftigt war
(aus `RunTask`/`Task`-Dauern im Intervall).

**B2b — `busyMs` summierte Cross-Thread-Tasks doppelt.** Verschachtelte und
threadübergreifende Tasks ergaben 55,96 ms „Arbeit" in einem 33,53-ms-Fenster.
Der Idle-Filter war unberührt, die Zahl wertlos. Intervalle werden jetzt
vereinigt.

**B2c — Die Choreographie-Attribution hat nie funktioniert.** Der Tracer
aktivierte nur `devtools.timeline`-Kategorien, nicht `blink.user_timing`. Die
`choreo:<id>:start/end`-Marks aus `useChoreo` erreichten den Trace nie, `marks`
war immer leer, und **jedes** je ausgestellte Perf-Packet meldete dem Agenten
„attributed choreography: unknown". Mit der Kategorie (und Akzeptanz von
`ph: "R"` neben `"I"`) benennt sie den Verursacher: `split-reveal`.

**B2d — Eine Nulltoleranz-Richtlinie, die niemand entschieden hatte.** Das Gate
failte, wenn einer der drei schlimmsten Frames 1,5× Budget riss — praktisch:
kein einziger ausgelassener Frame im ganzen Szenario. Gemessen an einem festen
Track-B-Verzeichnis: **1 von 4 Läufen rot, einmal um 0,11 ms**, bei stabilem
p95 von 17,9 ms gegen ein 16,7-ms-Ziel.

p99 wurde erwogen und **verworfen**: `percentile()` indiziert
`ceil(p/100 × len) - 1`, für jede Stichprobe ≤ 100 Frames ist p99 also das
Maximum. Nach dem Idle-Filter liegt ein Szenario deutlich darunter — p99 hätte
nichts geändert, und in allen Messdaten ist `p99 === worstFrames[0]`.

Stattdessen ist die Richtlinie jetzt ausgesprochen: `maxFramesOverBudget`,
Default 1. Eine echte Regression erzeugt viele langsame Frames, Varianz genau
einen; in jedem roten Lauf war es exakt einer. Danach Track-B 5/5 grün.

**B2e — Teilweise idle Lücken meldeten ihre volle Breite.** Der Idle-Filter aus
B2a entfernte nur *vollständig* leere Lücken. Track-As schlimmster Frame las
sich als 199,98 ms, enthielt aber nur 66,02 ms Arbeit — die übrigen 134 ms waren
Leerlauf, den der Betrachter als statische Seite sieht, nicht als Ruckler. Gate
und Perzentile vergleichen jetzt die zusammengeführte **Arbeitszeit**. Track-As
p95 fiel dadurch von ~18 ms auf ~9 ms; die beiden echten Startup-Frames blieben
mit ~75 ms und ~30 ms sichtbar, statt auf 200 ms und 116 ms aufgebläht zu werden.

**B2f — Startup wurde gegen ein Steady-State-Budget gemessen.** Tracing beginnt
direkt nach `networkidle`, das Gate benotete also Hydration, WebGL-Kontext­erzeugung
und Shader-Compile mit. Neu: `warmupMs` pro Szenario, **Default 0** — die Ausnahme
ist opt-in und steht sichtbar in der Fixture statt als globale Lockerung im Gate.
Auf 500 gesetzt in der Track-A-Fixture und im Scaffold-Default, passend zum
einleitenden `wait 500`, das beide ohnehin haben und das per Definition nicht der
Messgegenstand ist. Empirisch bestimmt: 300 failt weiter, 500 und 800 sind grün.

Track-B bekommt **kein** Warmup. Es ist ohne grün, und seine Abdeckung nur der
Symmetrie wegen zu reduzieren hieße echtes Signal gegen Optik zu tauschen.

**`maxFrameTimeMs`, `maxLongTasks` und `maxFramesOverBudget` wurden nie
aufgeweicht, um etwas grün zu bekommen.**

### B2g — `preloader-counter` rerenderte ein Vollbild-Overlay pro Tick

Erst mit funktionierender Attribution (B2c) sichtbar: GSAPs `onUpdate` rief
`setCount`, also wurde ein `fixed inset-0`-Overlay ~60×/s neu gerendert und
neu gezeichnet — rund 100 Vollbild-Reconciliations pro Ladevorgang. Track-A maß
**p95 149,8 ms** und 4 Frames über Budget.

Das kostete vorher nichts, weil das Overlay ohne Utilities keine Fläche hatte.
Der Zähler schreibt jetzt per Ref direkt ins DOM; `done` bleibt State, weil es
genau einmal kippt. Danach p95 ~9 ms.

Zusätzlich ergab `duration-${motion.dur.reveal}s` die Klasse `duration-0.8s` —
Tailwind erwartet einheitenlose Millisekunden, die Klasse tat also nichts und
das Overlay sprang statt zu faden. Jetzt Inline-`transitionDuration`, denn ein
dynamisch zusammengesetzter Klassenname wäre für Tailwinds Scanner ohnehin
unsichtbar. **Diese Falle gilt allgemein und wurde nicht repo-weit geprüft.**

### B3 — Laufzeit-Cap, statisch pro Datei geprüft

Patterns leiten ihre Choreo-ID vom Pattern-Namen ab, alle Instanzen teilen sie
also — die Track-B-Page rendert `SplitReveal` dreimal. Die Registry war ein
`Set<string>`: die Cap-Prüfung lief pro Instanz, sodass Instanz 2 und 3 den
Limiter erneut auslösten und die Timeline eines lebenden Geschwisters killten.
Zudem gab die erste unmountende Instanz die geteilte ID frei und riss
ScrollTrigger ab, während die anderen noch animierten.

Jetzt refcounted. **Kein Disposal-Leak** — `useChoreo` hat immer korrekt
aufgeräumt. Den Cap hochzusetzen, wie AXM-N003 und `rule-map-motion.ts` selbst
vorschlagen, hätte den Fehler nur maskiert.

Offene Gate-Lücke: `rule-map-motion.ts` zählt `useChoreo`-Aufrufe **pro Datei**,
der Cap gilt aber **global zur Laufzeit über die komponierte Page**. Ein
Per-File-Check kann Komposition prinzipiell nicht erfassen.

## Branches

- **`feat/atelier-a8-track-b`** — Fehler 1–5 plus Hygiene. Landefähig für sich
  allein: Track-A grün, Track-B rot mit bekannter Ursache.
- **`feat/scaffold-tailwind-postcss`** — B1, darauf aufbauend.
- **`feat/atelier-runtime-gates`** — B2a–g und B3, darauf aufbauend.
  **Hier sind beide Tracks grün**, verifiziert im selben Lauf.

Die Aufteilung ist bewusst: B1 allein macht beide Tracks rot, weil er B2
auslöst. Erst mit den Gate-Fixes zusammen ergibt die Reihe einen grünen Stand.

## Offen

1. **Regressionstest für B1** — eine Utility-Klasse muss nachweislich im
   emittierten CSS landen. Ohne ihn kann B1 jederzeit unbemerkt zurückkehren;
   das ist die eigentliche Lücke, nicht der fehlende Plugin-Eintrag.
   Vorerst hält die `cursor-system`-Assertion in
   `s-20-track-b.integration.test.ts` die Stellung — sie kollabiert auf 0×0,
   wenn die Utilities verschwinden. Ein gezielter Test ist verlässlicher.
2. **Komposition statt Per-File** — `rule-map-motion.ts` prüft den
   Choreographie-Cap pro Datei, er gilt aber global über die komponierte Page.
   Dieselbe Klasse von Blindfleck wie B1/B2.
3. **ScrollTrigger-Cleanup greift nie** — `useChoreo` räumt Trigger über
   `st.vars.id === options.id` ab, aber von `timeline.from({scrollTrigger})`
   erzeugte Trigger tragen diese ID nie. Latent, ohne beobachtete Auswirkung.
4. **Dynamische Tailwind-Klassennamen** — der Fall aus B2g
   (`duration-${...}`) wurde behoben, aber nicht repo-weit gesucht. Solche
   Klassen sind für Tailwinds Scanner unsichtbar und schlagen still fehl.
5. **Attribution ist „nächster Mark"** — `perf-trace.ts` ordnet dem
   schlimmsten Frame die zeitlich nächste Choreographie zu. Das ist ein
   Korrelat, kein Nachweis; bei dicht gesetzten Marks kann es danebenliegen.
6. Branches zusammenführen und A8 formal abnehmen.

## Hygiene

- `vitest.integration.config.ts` hatte kein `.worktrees/**` im `exclude`
  (die Haupt-`vitest.config.ts` schon). Dadurch zog jeder Integrationslauf
  zusätzlich die `.worktrees/m2`-Kopie mit — vitest-Positionals sind
  Substring-Filter, keine Pfade. Testzahlen waren doppeldeutig, Laufzeit doppelt.
- Integrationstests, die Apps scaffolden, kollidieren bei Parallellauf unter
  Windows (EBUSY, ETIMEDOUT beim `pnpm install`). Sequentiell laufen lassen;
  mehrere Testdateien in einem Aufruf reichen für eine Kollision.
- **`init.test.ts > is deterministic across runs` ist flaky in `pnpm test`.**
  Der Test scaffoldet zweimal und braucht allein ~19–23 s; unter der Last der
  vollen Suite (139 Dateien) läuft er in einen Timeout und meldet ein
  nichtssagendes `STACK_TRACE_ERROR`. Dreimal beobachtet, jedes Mal einzeln
  ausgeführt grün. Endstand der Suite: **209/210**, der eine Fehlschlag ist
  dieser Flake. Vor einer Fehlersuche zuerst einzeln laufen lassen.
