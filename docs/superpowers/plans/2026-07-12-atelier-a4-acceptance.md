# ATELIER A4 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §6, §7 (A4)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** 77c2149

## Goal

PERF-Stage: CDP-Tracing, Szenario-Runner, Budget-Auswertung und Trace-Attribution im FIX_PACKET; Jank-Fixture liefert `AXM-G001`-Packet mit benanntem schuldigen Tween.

## Verification Steps Performed

| Step | Command / Action | Expected | Actual |
|---|---|---|---|
| 1. Stage registered | `src/cli/pipeline/select-stages.ts` | `perf` after `e2e` | Verified |
| 2. Config schema | `src/cli/schemas/config.ts` | `perf` in pipeline stages | Verified |
| 3. Unit tests PERF | `pnpm vitest run src/cli/pipeline/stages/perf.test.ts` | 5/5 green | 5 passed |
| 4. Jank frame fixture | Mock trace with 34ms frame | `AXM-G001` + attribution `jank` | Verified |
| 5. Long-task fixture | Mock trace with long task | `AXM-G001` | Verified |
| 6. Cleanup test | Mock browser/server | Both closed | Verified |
| 7. useChoreo marks | `core-use-choreo.ts` | `performance.mark("choreo:<id>:start/end")` | Verified |
| 8. Full unit suite | `pnpm test` in worktree | No failures | Green |
| 9. Fresh scaffold perf stage | `axm pipeline run --stage perf` | Runs/skips gracefully | GREEN |

## Implemented Components

1. **PERF Stage** (`src/cli/pipeline/stages/perf.ts`):
   - Entdeckt `perf/*.perf.json`.
   - Startet statischen Server auf `out/`.
   - Fährt Szenarien mit Playwright + CDP-Tracing.
   - Wandelt unerwartete Fehler in `AXM-G000`-Packet um.
   - Schließt Browser und Server deterministisch.

2. **Szenario-Runner** (`src/cli/pipeline/stages/perf-runner.ts`):
   - Unterstützt Schritte `scroll`, `click`, `wait`.
   - CDP-Tracing über `Tracing.start/end`.
   - Statischer Server mit Pfad-Sanitisierung.

3. **Trace-Analyse** (`src/cli/pipeline/stages/perf-trace.ts`):
   - Berechnet p95/p99 Frame-Times aus `DrawFrame`-Events.
   - Erkennt Long Tasks (>50ms).
   - Liest LCP- und CLS-Events.
   - Attribution zur nächsten `choreo:*`-Performance-Mark.

4. **Packet-Builder** (`src/cli/pipeline/stages/perf-packet.ts`):
   - Baut `AXM-G001`-FIX_PACKET mit `traceSummary`.
   - Enthält `worstFrames`, `longTasks`, `p95FrameMs`, `p99FrameMs`, `lcpMs`, `clsScore`, `attributedChoreoId`.
   - Unterscheidet Frame-Budget- und Long-Task-Verletzung in `probableCause`/`fixHint`.

5. **Performance-Marks in useChoreo** (`src/cli/templates/core-use-choreo.ts`):
   - `performance.mark(\`choreo:${options.id}:start\`)` vor Timeline-Erzeugung.
   - `performance.mark(\`choreo:${options.id}:end\`)` bei Timeline-Abschluss und Cleanup.

6. **Scaffold-Integration** (`src/cli/templates/perf-scenario.ts`, `src/cli/templates/app.ts`):
   - `axm init` erzeugt `perf/home.perf.json` mit einem Scroll-Szenario.
   - `perf/` ist als `AGENT`-Zone markiert.

## Known Gaps / P1 Notes

- **Echte Jank-Fixture-Seite:** Aktuell wird das Jank-Verhalten durch Mock-Trace-Events in Unit-Tests abgedeckt. Eine reale Next.js-Seite, die absichtlich Layout-Thrashing erzeugt und im Static-Build gemessen wird, fehlt noch und ist als P2-Ergänzung dokumentiert.
- **Statischer Build-Voraussetzung:** Die PERF-Stage benötigt `out/`. Fehlt das Verzeichnis, wird die Stage übersprungen. Für vollständige End-to-End-Perf-Messungen muss der Build vorher laufen.
- **Attributions-Heuristik:** Die Zuordnung zum schuldigen Tween basiert auf zeitlicher Nähe zur nächsten `choreo:*`-Mark. Präzisere Attribution via Source-Maps bleibt P1 für A7/A8.
- **WebGL-Budgets G002–G005:** Noch nicht implementiert; ATELIER-Spec §5.5 sieht Drawcall-, Texturspeicher- und Shader-Budgets vor.

## Next Step

A5 — Pattern-Library Welle 1 (9 Patterns: 3 WebGL, 3 Scroll, 3 Typo) inkl. Golden-Screenshots; jedes Pattern in 2 Direction-Presets instanziiert → sichtbar unterschiedlich, jeweils GREEN.
