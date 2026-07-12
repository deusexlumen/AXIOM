# ATELIER A1 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §5.3, §5.4, §14 (A1)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** c9e91c3

## Goal

Tokens v3 + Motion-System: schemas for `MOTION.axm.json` and `DIRECTION.axm.json`, `atl motion build`, Fluid-Typo-Generator, and byte-identical golden output from `MOTION.json` to `src/generated/motion.ts`.

## Verification Steps Performed

| Step | Command / Action | Expected | Actual |
|---|---|---|---|
| 1. DIRECTION schema validation | Unit tests (`src/cli/schemas/direction.test.ts`) | Accepts valid direction, rejects invalid | Green |
| 2. Fluid typography generator | Unit tests (`src/cli/generators/typography.test.ts`) | Deterministic `clamp()` tokens, scale-dependent | Green |
| 3. Direction token generator | Unit tests (`src/cli/generators/direction-tokens.test.ts`) | Typo + color + spacing tokens from DIRECTION | Green |
| 4. `atl motion build` | `node dist/cli/bin.js motion build` in demo | Generates `src/generated/motion.ts` | Output contains `src/generated/motion.ts` |
| 5. `atl tokens build` with DIRECTION | `node dist/cli/bin.js tokens build` in demo | Regenerates `theme.css` with DIRECTION tokens | CSS contains `--font-size-*`, `--color-bg-primary`, `--space-4`, etc. |
| 6. Golden motion output | `src/cli/generators/motion.test.ts` | Byte-identical output for fixed input | Green |
| 7. Full unit suite | `pnpm test` in worktree | No failures | Green |

## Implemented Components

1. **`DIRECTION.axm.json` schema** (`src/cli/schemas/direction.ts`):
   - `directionId`, `thesis`
   - `typography`: display/text roles with variable font axis, case, scaleRatio
   - `color`: story + `tokensDraft` map
   - `space`: language, density (0–1), gridBias
   - `motionPersonality`: adjectives, tempo, playfulness
   - `texture`: grain, noiseShader
   - `webglLevel` (0–3), `sceneIdeas`

2. **Fluid typography generator** (`src/cli/generators/typography.ts`):
   - 8 steps: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `display`
   - Linearly interpolated `clamp(min, intercept + slope*vw, max)`
   - Deterministic, tested

3. **Direction token generator** (`src/cli/generators/direction-tokens.ts`):
   - Combines fluid typography, font families, spacing scale, and color tokens
   - Spacing derived from `space.density` via `base = 4 + density * 12`

4. **Token build integration** (`src/cli/commands/tokens-build.ts`):
   - Reads optional `DIRECTION.axm.json`
   - Injects direction tokens into `src/generated/theme.css`
   - `motionBuild()` extracted for `atl motion build`

5. **CLI commands** (`src/cli/commands/registry.ts`):
   - `atl tokens build` — full token + motion generation
   - `atl motion build` — motion.ts only

6. **Default DIRECTION scaffold** (`src/cli/templates/direction.ts`):
   - `atl init` now writes `DIRECTION.axm.json`

## Golden-File Status

`src/cli/generators/motion.test.ts` already asserts byte-identical output from a fixed `MotionJson` input to `motion.ts`. No regression introduced.

## N001/N004 Fixtures

These fixtures are formally required by the A1 completion criterion but are logically part of the Motion-Lint stage (A3). They are deferred to A3 to avoid building lint rules before the motion token consumption paths are exercised by real components.

## Next Step

A2 — Brief + Direction-Workflow: Elicitation catalog, `BRIEF.axm.json` schema, Style-Tile order template, and Freeze/Amend (I-20) enforcement.
