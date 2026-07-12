# ATELIER A0 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §14 (A0)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** 0f6888e

## Goal

Prove that the ATELIER v3.0 scaffold boots a Next.js 15 + React Three Fiber + GSAP + Lenis project, that the core wrappers (`useChoreo`, `<Stage>`) are present, and that the new I-18 invariant (no raw GSAP/Three imports outside core wrappers) is enforced by the custom ESLint plugin.

## Verification Steps Performed

| Step | Command | Expected | Actual |
|---|---|---|---|
| 1. Substrate check | `pnpm test` in worktree | Unit tests pass | 77 suites, 93 tests green |
| 2. Scaffold fresh demo | `node dist/cli/bin.js init atelier-a0-demo --skip-install` | Creates project skeleton | Created 38 files + bundled plugin/CLI packages |
| 3. Install deps | `pnpm install --ignore-workspace --ignore-scripts --prefer-offline` | Resolves without error | 453 packages resolved in ~50 s |
| 4. Build | `pnpm build` | Next.js static export succeeds | Compiled in ~23 s, static pages exported |
| 5. Lint clean | `pnpm lint` | No ESLint errors | 0 problems |
| 6. I-18 fixture | Create `src/components/Violation.tsx` with `import gsap from "gsap"`; run `pnpm lint` | Lint fails with I-18 error | Failed with `axiom/no-raw-motion-engine` pointing at `Violation.tsx` |
| 7. Unit tests | `pnpm test` in worktree | JSON report, no failures | Green |

## Key Fixes Applied

1. **ESLint rule normalization** — `no-default-export` and `no-raw-motion-engine` now strip `file://` prefixes and normalize backslashes to forward slashes before matching paths. This fixes false positives under ESLint 9 Flat Config on Windows.
2. **Generated ESLint config** — `eslint-config.ts` now:
   - Applies `typescript-eslint/strictTypeChecked` only to `**/*.ts`/`**/*.tsx`.
   - Adds a separate JS config using `disableTypeChecked`.
   - Ignores `packages/**`, `next-env.d.ts`, and `eslint.config.js`.
   - Disables `no-unsafe-call`, `no-unsafe-member-access`, and `no-unsafe-return` for `next.config.ts`.
3. **`.d.ts` whitelist** — `no-default-export` skips `*.d.ts` files, allowing shader module declarations with default exports.
4. **Test isolation** — `vitest.config.ts` excludes `atelier-a0-demo/**` so scaffolded demo files are not scanned by the framework test suite.
5. **Integration test update** — `init.integration.test.ts` now expects a Next.js `.next` output directory and asserts on the printed rule id (`no-raw-motion-engine`) instead of the internal `messageId`.

## Known Limitations

- The `init.integration.test.ts` I-18 case passes in ~140 s, dominated by `pnpm install` in a temporary directory. Running the full integration suite (`pnpm run test:integration`) still times out at 300 s when many integration tests are executed sequentially. This is a test-runner/performance issue, not a product defect; the manual scaffold/build/lint cycle is green.
- The generated demo prints a Next.js warning about inferred workspace root and missing Next.js ESLint plugin. Neither is blocking for A0; the Next.js plugin will be added when the project-specific lint preset is hardened in A1/A3.

## Artifacts

- Scaffolded demo: `.worktrees/m2/atelier-a0-demo/` (untracked, can be regenerated with `axm init`).
- Motion sidecar generated at scaffold time: `MOTION.axm.json`.
- Core wrappers:
  - `src/core/useChoreo.ts`
  - `src/core/Stage.tsx`
  - `src/core/QuadMesh.tsx`
  - `src/core/lenis.ts`

## Next Step

A1 — Tokens v3 + Motion-System: finalize `MOTION.axm.json` schema, implement `atl motion build`, and generate the Fluid Typography scale.
