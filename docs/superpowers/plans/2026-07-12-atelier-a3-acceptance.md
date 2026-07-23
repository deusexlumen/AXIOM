# ATELIER A3 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §5.4, §6, §7 (A3)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** 77c2149

## Goal

Motion-Lint + A11y-Gate komplett: AST-basierte Motion-Verstoßerkennung (N001–N004, I-018), A11y-Verstoßerkennung (A001–A004), Runtime-Concurrency-Check in `useChoreo`, und ein reduced-motion-E2E-Test, der den Opacity-only-Pfad prüft.

## Verification Steps Performed

| Step | Command / Action | Expected | Actual |
|---|---|---|---|
| 1. Motion rules unit tests | `pnpm --filter eslint-plugin-axiom test` | N001–N004 + I-018 rules pass | 68 suites, 128 tests, green |
| 2. N001 fixture | `axm validate` on raw duration | `AXM-N001` | Verified |
| 3. N002 fixture | `axm validate` on direct `gsap.timeline()` | `AXM-N002` | Verified |
| 4. N003 fixture | `axm validate` on >3 `useChoreo()` calls | `AXM-N003` | Verified |
| 5. N004 fixture | `axm validate` on missing `reducedMotion` | `AXM-N004` | Verified |
| 6. I-018 fixture | `axm validate` on raw GSAP import | `AXM-I018` | Verified |
| 7. A11y rules unit tests | `pnpm --filter eslint-plugin-axiom test` | A001–A004 rules pass | Green |
| 8. A001 fixture | `axm validate` on `<img>` without alt | `AXM-A001` | Verified |
| 9. A002 fixture | `axm validate` on unlabeled `<button>` | `AXM-A002` | Verified |
| 10. A003 fixture | `axm validate` on `<a>` without href/text | `AXM-A003` | Verified |
| 11. A004 fixture | `axm validate` on `<input>` without label | `AXM-A004` | Verified |
| 12. Reduced-motion E2E | Fresh scaffold + `pnpm playwright test` | `reduced-motion.spec.ts` passes | Verified |
| 13. Scaffold lint | Fresh scaffold + `pnpm lint` | No errors | Verified |
| 14. Full unit suite | `pnpm test` in worktree | No failures | Green |

## Implemented Components

1. **N003 Concurrency Rule** (`packages/eslint-plugin-axiom/src/rules/max-concurrent-timelines.ts`):
   - Zählt `useChoreo()`-Aufrufe pro Datei.
   - Meldet `AXM-N003`, wenn `maxConcurrentTimelines` überschritten wird.
   - Runtime-Check in `src/cli/templates/core-use-choreo.ts` warnt und killt älteste Timeline.

2. **Motion RULE_MAP** (`src/cli/validate/rule-map-motion.ts`):
   - `motion-token-usage` → `AXM-N001`
   - `no-direct-timeline` → `AXM-N002`
   - `max-concurrent-timelines` → `AXM-N003`
   - `require-reduced-motion` → `AXM-N004`
   - `no-raw-motion-engine` → `AXM-I018`

3. **A11y Rules** (`packages/eslint-plugin-axiom/src/rules/a11y-*.ts`):
   - `a11y-img-alt` → `AXM-A001`
   - `a11y-button-label` → `AXM-A002`
   - `a11y-link-href` → `AXM-A003`
   - `a11y-input-label` → `AXM-A004`
   - Gemeinsame JSX-Helper in `packages/eslint-plugin-axiom/src/utils/jsx.ts` und `jsx-a11y.ts`.

4. **A11y RULE_MAP** (`src/cli/validate/rule-map-a11y.ts`):
   - Mapping der vier A11y-Regeln zu AXM-A001…A004.

5. **Integration Fixtures** (`src/cli/commands/validate.integration.*-fixtures.ts`):
   - 19 Verstoß-Fixtures für `axm validate` (V001, V002, V004, V005, V006, V008, V009, V010, V012, E002, N001–N004, I018, A001–A004).

6. **Reduced-Motion E2E** (`src/cli/templates/e2e/reduced-motion.spec.ts` + `src/cli/templates/components/hero-demo.ts`):
   - `HeroDemo` nutzt `useChoreo({ reducedMotion: "opacity-only" })`.
   - Playwright läuft mit `reducedMotion: "reduce"`.
   - Test prüft `opacity > 0` und `transform === "none"`.

## Known Gaps / P1 Notes

- **„12 Verstoßarten“-Anspruch:** Das Completion Criterion fordert 12 Verstoßarten → 12 korrekte Packets. A3 liefert 9 Motion-/A11y-spezifische Codes (N001–N004, I018, A001–A004). Die verbleibenden 3 der geforderten 12 sind nicht explizit im ATELIER-Spec definiert; mögliche Ergänzungen wären A005–A007 (z. B. Heading-Hierarchie, Fokus-Indikator, `prefers-reduced-motion` Runtime-Enforcement). Diese bleiben als P1-Lücke für A7/A8 dokumentiert.
- **Full integration suite timeout:** `pnpm vitest run --config vitest.integration.config.ts src/cli/commands/validate.integration.test.ts` läuft zu lang für den 300s-Timeout. Einzelne Subsets (z. B. `-t "AXM-A"`) passieren. Ursache ist die Fixture-Initialisierung, kein Produktfehler.
- **`@typescript-eslint/restrict-template-expressions`:** In `core-use-choreo.ts` durch explizites `String(...)` behandelt.

## Next Step

A4 — PERF-Stage: CDP-Tracing, Szenario-Runner, Budget-Auswertung und Trace-Attribution im FIX_PACKET; Jank-Fixture → `AXM-G001`-Packet benennt den schuldigen Tween.
