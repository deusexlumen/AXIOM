# ATELIER A8 — Abnahme-Report (S-20)

> Status: **Track-A GREEN, Track-B BLOCKED.** Track-B ist nicht an fehlender
> Implementierung blockiert, sondern an zwei Framework-Blindflecken, die der
> Track-B-Integrationstest überhaupt erst sichtbar gemacht hat.

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

**Beobachtungsstand:** Der letzte tatsächliche Track-B-Lauf endete in der
E2E-Stage mit zwei roten Specs — `reduced-motion.spec.ts` (Fehler 5, hier
behoben) und `smoke.spec.ts` (`cursor-system` hidden). Nach der Fixture-Korrektur
wurde Track-B nicht erneut vollständig gefahren; dass `cursor-system` der
verbleibende Blocker ist, ist belegte Schlussfolgerung, keine erneute Messung.

### B2 — Perf-Gate hat nie etwas Reales gemessen

Sobald B1 behoben ist, greift `<Stage className="h-screen w-full">` zum ersten
Mal, die WebGL-Canvases rendern in voller Viewport-Größe — und die PERF-Stage
fällt auf **beiden** Tracks.

Messwerte Track-A (`scroll-and-hover`, Budget 16,7 ms × 1,5 = 25,05 ms):

| Lauf | p95 | schlimmste Frames |
|---|---|---|
| Einzelszenario, kalt | 18,3 ms | 250 / 149 / 134 ms |
| nach vorgeschaltetem Warmup | **132,6 ms** | 317 / 234 / 201 ms |

Der warme Lauf ist deutlich **schlechter** — also kein einmaliger
Shader-Compile. Es akkumuliert etwas über Navigationen hinweg; der Runner nutzt
eine einzige Page für alle Szenarien (`perf-runner.ts:89`). Passt zu den
`AXM-N003: Too many concurrent choreographies`-Warnungen aus dem Track-B-Lauf.
Verdacht: WebGL-Kontexte/Timelines werden beim Unmount nicht disponiert.

Tracing startet **nach** `waitUntil: "networkidle"`, die Frames sind also kein
Ladeartefakt.

Das Gate (`perf.ts:55`) failt, sobald einer der drei schlimmsten Frames das
Budget reißt — ein reines Worst-Frame-Kriterium ohne Startup-/Steady-State-
Trennung.

**Perf-Budgets wurden nicht angefasst.** Ob hier ein echter Kostenfehler, ein
Disposal-Leak oder ein falsch geschnittenes Gate vorliegt, ist offen und
gehört bewusst entschieden, nicht weggekonfiguriert.

## Landing-Stand

Commit 1 (Fehler 1–5, Hygiene) landet auf `feat/atelier-a8-track-b` ohne den
Tailwind-Fix: **Track-A grün, Track-B rot mit bekannter Ursache.**

Der Tailwind-Fix liegt auf einem **eigenen Branch**
(`feat/scaffold-tailwind-postcss`), nicht auf dem landefähigen Branch — sonst
würde er beim Mergen mitgenommen. Er ist korrekt, macht aber ohne Perf-Klärung
beide Tracks rot.

Track-A grün ist belegt durch einen Lauf auf exakt diesem funktionalen Stand
(Generator-Fixes + exakte Pins, ohne Tailwind-Fix). Spätere Änderungen betreffen
Track-A nicht: der `.worktrees`-Exclude (Testzahl 2 → 1) sowie Track-B-Fixture,
Kommentare und Doku.

`s-20-track-b.integration.test.ts` trägt einen Kopfkommentar mit dieser Ursache.

## Offen

1. **B2 entscheiden** — WebGL-Disposal im `Stage`-Wrapper prüfen; echte
   Frame-Kosten der Patterns ermitteln; klären ob das Gate p95 statt
   Worst-Frame prüfen sollte (mit eigenem Startup-Budget).
2. **Regressionstest für B1** — eine Utility-Klasse muss nachweislich im
   emittierten CSS landen. Ohne diesen Test kann B1 jederzeit zurückkehren; das
   ist die eigentliche Lücke, nicht der fehlende Plugin-Eintrag. Der Test kann
   nur mit dem Fix zusammen grün sein und gehört deshalb auf
   `feat/scaffold-tailwind-postcss`, nicht davor.
3. Danach Tailwind-Branch mergen und Track-B erstmals vollständig grün
   nachweisen.

## Hygiene

- `vitest.integration.config.ts` hatte kein `.worktrees/**` im `exclude`
  (die Haupt-`vitest.config.ts` schon). Dadurch zog jeder Integrationslauf
  zusätzlich die `.worktrees/m2`-Kopie mit — vitest-Positionals sind
  Substring-Filter, keine Pfade. Testzahlen waren doppeldeutig, Laufzeit doppelt.
- Integrationstests, die Apps scaffolden, kollidieren bei Parallellauf unter
  Windows (EBUSY, ETIMEDOUT beim `pnpm install`). Der Determinismus-Test
  in `init.test.ts` braucht allein ~23 s. Sequentiell laufen lassen.
