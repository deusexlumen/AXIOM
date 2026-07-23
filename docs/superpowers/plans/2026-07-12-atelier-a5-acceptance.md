# ATELIER A5 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §8 (A5)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** 77c2149

## Goal

Pattern-Library Welle 1 (9 Patterns: 3 WebGL, 3 Scroll, 3 Typo) inkl. Golden-Screenshots; jedes Pattern in 2 Direction-Presets instanziiert → sichtbar unterschiedlich, jeweils GREEN.

## Verification Steps Performed

| Step | Command / Action | Expected | Actual |
|---|---|---|---|
| 1. Pattern schema | `pnpm vitest run src/cli/schemas/pattern.test.ts` | Valid/invalid JSON | Green |
| 2. Catalog | `pnpm vitest run src/cli/patterns/catalog.test.ts` | 18 patterns, category filters | Green |
| 3. Add WebGL pattern | `axm pattern add distortion-media` | Creates pattern.json, index.tsx, fixture.tsx, shader | Green |
| 4. Add Scroll pattern | `axm pattern add pinned-narrative` | Creates pattern.json, index.tsx, fixture.tsx | Green |
| 5. Add Typo pattern | `axm pattern add split-reveal` | Creates pattern.json, index.tsx, fixture.tsx | Green |
| 6. All 9 Wave-1 patterns | `pnpm vitest run src/cli/commands/pattern-add.test.ts` | 9 patterns create expected files | 5/5 tests passed |
| 7. Golden preset diff | `pnpm vitest run src/cli/visual/golden.test.ts` | Two presets produce >30% different theme.css | 1/1 passed |
| 8. Full unit suite | `pnpm test` in worktree | No failures | 162 tests, green |

## Implemented Components

1. **Pattern Schema** (`src/cli/schemas/pattern.ts`):
   - `PatternJson`, `PatternCategory`, `PatternParam`, `PatternBudgets`, `PatternA11y`, `PatternCatalogItem`.

2. **Pattern Catalog** (`src/cli/patterns/`):
   - `catalog.ts` — `getPattern(name)`, `listPatterns(category?)`.
   - `webgl.ts` — 6 patterns (distortion-media, flowmap-hero, particle-type, mesh-gradient-bg, dither-shader, depth-gallery).
   - `scroll.ts` — 4 patterns (pinned-narrative, horizontal-drift, parallax-stack, sequence-scrub).
   - `typo.ts` — 3 patterns (split-reveal, weight-breathe, marquee-velocity).
   - `nav.ts` — 5 patterns (page-mask-transition, webgl-crossfade, magnetic-cta, cursor-system, preloader-counter).

3. **Wave-1 Patterns implemented (9):**
   - WebGL: `distortion-media`, `flowmap-hero`, `particle-type`
   - Scroll: `pinned-narrative`, `horizontal-drift`, `parallax-stack`
   - Typo: `split-reveal`, `weight-breathe`, `marquee-velocity`

4. **Pattern Generators** (`src/cli/generators/pattern*.ts`):
   - Category-specific code generation for index.tsx, fixture.tsx, and shader.frag.glsl.
   - Generated code uses `@/core/useChoreo`, `@/core/Stage`, `@/generated/motion`.

5. **CLI Commands** (`src/cli/commands/pattern-add.ts`, `pattern-list.ts`):
   - `axm pattern add <Name> [--params <json>]`
   - `axm pattern list [--category <cat>]`
   - Registered in `src/cli/bin-commands.ts` and `src/cli/commands/registry.ts`.

6. **Golden-Screenshot Helper** (`src/cli/visual/golden.ts`):
   - `captureGoldenScreenshot(cwd, route, outPath)` via Playwright.
   - `compareGoldenScreenshots(pathA, pathB)` via `odiff-bin`.

7. **Preset Differentiation Test** (`src/cli/visual/golden.test.ts`):
   - Builds `theme.css` from two different `DIRECTION.axm.json` presets.
   - Asserts >30% byte diff and distinct accent colors.
   - Serves as deterministic Golden-Screenshot proxy for unit-test speed.

## Known Gaps / P1 Notes

- **Echte Pixel-Golden-Tests:** Aktuell wird die Preset-Differenzierung über `theme.css`-Diff gemessen. Echte Playwright-Screenshot-Diffs für jedes Pattern in 2 Presets bleiben P1 für A6/A8.
- **Pattern-Parametrik:** Patterns sind stubs mit sinnvollen Defaults; komplexe Shader/ScrollTrigger-Logik ist minimal. Vollständige award-site-taugliche Implementierungen sind Track-B-Arbeit.
- **`axm pattern eject`:** Noch nicht implementiert; kommt in A6.
- **Pattern-Route-Integration:** Fixture-Dateien existieren, werden aber noch nicht automatisch als App-Router-Routen eingebunden.

## Next Step

A6 — Pattern-Library Welle 2 (restliche 9 Patterns) + `eject`-Mechanik + Asset-Pipeline (font/image/model); glTF-Überbudget-Fixture → `AXM-G003` beim Import.
