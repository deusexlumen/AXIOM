# ATELIER A6 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §8, §9 (A6)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** 77c2149

## Goal

Pattern-Library Welle 2 (restliche 9 Patterns) + `eject`-Mechanik + Asset-Pipeline (font/image/model); glTF-Überbudget-Fixture → `AXM-G003` beim Import; eject → AGENT-Zone-Kopie, Pipeline weiter GREEN.

## Verification Steps Performed

| Step | Command / Action | Expected | Actual |
|---|---|---|---|
| 1. Wave-2 pattern generation | `pnpm vitest run src/cli/commands/pattern-add.test.ts` | 9 Wave-2 patterns create expected files | Green |
| 2. WebGL Wave-2 | `axm pattern add mesh-gradient-bg/dither-shader/depth-gallery` | pattern.json + index.tsx + fixture.tsx + shader | Verified |
| 3. Scroll Wave-2 | `axm pattern add sequence-scrub` | pattern.json + index.tsx + fixture.tsx | Verified |
| 4. Nav/Transition Wave-2 | `axm pattern add page-mask-transition/webgl-crossfade/magnetic-cta/cursor-system/preloader-counter` | pattern.json + index.tsx + fixture.tsx | Verified |
| 5. Pattern eject | `pnpm vitest run src/cli/commands/pattern-eject.test.ts` | Copies to `src/components/<Name>/`, updates agent-context | 2/2 passed |
| 6. Asset font | `axm assets font add <path>` | Copies to `public/fonts/`, writes `src/styles/fonts.css` | Verified |
| 7. Asset image | `axm assets image add <path>` | Copies to `public/images/`, writes metadata | Verified |
| 8. Asset model G003 | `pnpm vitest run src/cli/commands/assets-model.test.ts` | Over-budget glTF → `AXM-G003` | 2/2 passed |
| 9. Full unit suite | `pnpm test` in worktree | No failures | 167 tests, green |

## Implemented Components

1. **Wave-2 Patterns (9):**
   - WebGL: `mesh-gradient-bg`, `dither-shader`, `depth-gallery`
   - Scroll: `sequence-scrub`
   - Nav/Transition: `page-mask-transition`, `webgl-crossfade`, `magnetic-cta`, `cursor-system`, `preloader-counter`
   - Total catalog: 18 patterns.

2. **Pattern Eject** (`src/cli/commands/pattern-eject.ts`):
   - `axm pattern eject <Name>` copies `src/patterns/<name>/` → `src/components/<Name>/`.
   - Preserves shader files (`.frag.glsl`) and rewrites imports.
   - Updates `agent-context.json`: removes pattern entry, adds component entry.
   - Output NDJSON.

3. **Asset Pipeline** (`src/cli/commands/assets.ts` + `src/cli/assets/`):
   - `axm assets font add <path>` → `public/fonts/<name>.woff2` + `src/styles/fonts.css` with `@font-face` and `font-display: block`.
   - `axm assets image add <path>` → `public/images/<name>.<ext>` + metadata JSON.
   - `axm assets model add <path>` → validates `.gltf`/`.glb`, estimates texture memory from bufferViews/images, checks budget (default 64 MB), emits `AXM-G003` if exceeded.
   - `AssetEntry` schema in `src/cli/schemas/asset.ts`.

4. **G003 Fixture** (`src/cli/commands/assets-model.test.ts`):
   - Fake glTF with oversized image bufferView triggers `AXM-G003`.
   - Small model within budget is copied and registered.

## Known Gaps / P1 Notes

- **Asset processing is stubbed:** No `sharp`, no `gltf-pipeline`, no real font subsetting or image resizing. The pipeline validates, copies, and budgets, but does not transcode/compress assets.
- **Image metadata:** Dimensions are placeholders; real parsing would need `sharp` or `image-size`.
- **Model budget source:** Currently falls back to default 64 MB; per-pattern budgets from `pattern.json` are read but not yet enforced as primary source.
- **Registry.ts LOC:** Slightly over 120 LOC pre-existing; not introduced by A6.

## Next Step

A7 — CRITIC-Stage + Anti-Template-Heuristik + MCP-Server; CLI≡MCP-Golden-Test; CRITIC-Report schema-valide auf 3 Fixture-Sites; Heuristik erkennt präparierte Generik-Site.
