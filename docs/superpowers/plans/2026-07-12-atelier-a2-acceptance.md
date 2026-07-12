# ATELIER A2 — Acceptance Report

**Date:** 2026-07-12
**Spec:** ATELIER_SPEC_v3.0.md §5.1, §5.2, §14 (A2)
**Branch/Worktree:** feat/m2 (`.worktrees/m2`)
**Commit:** e53a849

## Goal

Brief + Direction-Workflow: structured discovery interview, BRIEF schema, Style-Tile order template, Freeze/Amend (I-20), and a simulation that fills a valid BRIEF.axm.json.

## Verification Steps Performed

| Step | Command / Action | Expected | Actual |
|---|---|---|---|
| 1. BRIEF schema validation | Unit tests (`src/cli/schemas/brief.test.ts`) | Accepts valid brief, rejects <2 refs, rejects out-of-range webglAppetite | Green |
| 2. Interview simulation | Unit tests (`src/cli/elicitation/interview.test.ts`) | AnswerSet → valid BriefJson, missing-field detection | Green |
| 3. `atl brief elicit` | `node dist/cli/bin.js brief elicit --answers answers.json` in demo | Writes `BRIEF.axm.json` | File written, valid JSON |
| 4. `atl brief validate` | `node dist/cli/bin.js brief validate` in demo | Confirms schema-valid BRIEF | `{ ok: true, valid: true }` |
| 5. `atl direct generate` | Unit + manual test | Creates 3 candidates + style-tile orders | Green / verified |
| 6. `atl direct choose` | Manual test in demo | Freezes chosen DIRECTION with hash | `frozen: true` |
| 7. I-20 enforcement | Mutate `DIRECTION.axm.json`, run `validate` | `AXM-R002` with I-20 reference | Verified |
| 8. I-20 amend | `atl direct amend --reason "Client feedback"` | Updates frozen hash, validate green | Verified |
| 9. Full unit suite | `pnpm test` in worktree | No failures | Green |

## Implemented Components

1. **`BRIEF.axm.json` schema** (`src/cli/schemas/brief.ts`):
   - Track (curated/bespoke), brand, audience, goal, references (min 2), mood, content, constraints, webglAppetite (0–3).

2. **Elicitation catalog** (`src/cli/elicitation/catalog.ts`):
   - 4 rounds, max 2 questions per round.
   - Covers track/goal, brand/audience, references/taste, content/constraints.

3. **Interview simulation** (`src/cli/elicitation/interview.ts`):
   - `buildBrief(answers)` → valid `BriefJson`.
   - `listMissingFields(answers)` → required gaps.

4. **CLI commands** (`src/cli/commands/brief.ts`, registry):
   - `atl brief elicit --answers <path>` — writes `BRIEF.axm.json`.
   - `atl brief validate` — validates existing `BRIEF.axm.json`.

5. **Direction workflow** (`src/cli/commands/direct.ts`):
   - `atl direct generate` — 3 candidates + style-tile WORK_ORDERs.
   - `atl direct choose <id>` — freezes selected direction.
   - `atl direct amend --reason <text>` — updates frozen hash.

6. **Style-Tile order template** (`src/cli/templates/style-tile-order.ts`):
   - WORK_ORDER for each direction candidate with token-only acceptance criteria.

7. **I-20 enforcement** (`src/cli/validate/checks.ts`):
   - `checkDirectionFreeze` emits `AXM-R002` on hash drift.
   - `checkIntegrity` skips frozen direction files so the specialized R002 check owns the violation.

## Known Gaps / Next Steps

- The elicitation CLI is non-interactive by design (AXIOM I-11). A future helper could render the question catalog as Markdown for the agent to consume, but the deterministic validation path is complete.
- `atl plan` is not yet track-aware; it will be hardened when Track-A vs Track-B DAGs are needed in A5/A8.

## Next Step

A3 — Motion-Lint + A11y-Gate: implement N001/N004 detection and reduced-motion E2E path.
