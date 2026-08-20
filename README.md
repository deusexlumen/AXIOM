# AXIOM

**A CLI-enforced framework for agent-native web apps.** Structure, ownership, and code shape aren't conventions here — they're machine-checked invariants that fail the build.

> Determinism > elegance. Machine-readability > human ergonomics. One way, no options.

---

## The idea

Most frameworks assume a human reviews every PR. AXIOM assumes an LLM writes most of the code and optimizes for that: every mutation goes through a CLI (`axm` / `atl`), every output is NDJSON, every failure is a structured `FIX_PACKET` an agent can act on without a human translating the error first.

```
$ axm pipeline run
{"type":"result","ok":false,"data":{
  "packetId":"axm-l001_...","errorCode":"AXM-L001","stage":"lint",
  "severity":"BLOCKING","target":{"file":"src/patterns/cursor-system/index.tsx","line":4},
  "message":"'motion' is defined but never used.",
  "agentInstruction":"Correct src/patterns/cursor-system/index.tsx and re-run axm pipeline run."
}}
```

No prose to parse. No "please fix the linting issues" back-and-forth. One file, one instruction, retry.

## What it enforces

A generated app is split into ownership zones, and writing outside your zone doesn't get flagged in review — it fails the pipeline:

| Zone | Who writes it | Violation |
|---|---|---|
| `LOCKED` | Framework only | Pipeline abort (`AXM-V010`) |
| `MACHINE` | Only the `axm` CLI | Hash mismatch (`AXM-V011`) |
| `AGENT` | Free to edit | Subject to invariants below |
| `OPERATOR` | Human only | Agents touch it via explicit CLI command |

And every file in an `AGENT` zone answers to a fixed set of invariants — no `any`, no barrel files, one named export per component, max 120 LOC, absolute imports only, every component ships a `<Name>.spec.json` sidecar. Thirteen rules total, enforced by a custom ESLint plugin and the pipeline's own validate stage, not by a style guide nobody reads.

```
GENERATE → VALIDATE → TYPECHECK → LINT → BUILD → UNIT → E2E → PERF → CRITIC → GREEN
```

Fail-fast, three retries, then it escalates to a human instead of looping forever.

## ATELIER — the design layer on top

AXIOM scaffolds the app; **ATELIER** decides what it looks like. Feed it a brief, get back three direction candidates, freeze one, and the pipeline builds a Next.js/GSAP/React-Three-Fiber site from it — complete with a `CRITIC` stage that scores the result against your brief and flags anything that reads as generic AI output.

Two tracks, two different jobs:

- **Track-A (curated)** — pick a preset from a vetted catalog, ship a campaign page fast.
- **Track-B (bespoke)** — generate real direction candidates from the brief, for work that has to look like nobody else's.

Both run end-to-end through the same pipeline, including a mocked deploy step and a live `pnpm audit` gate that blocks on high-severity dependency advisories.

## Quickstart

```bash
pnpm install
pnpm build              # tsc && tsc-alias -> dist/
pnpm dev init my-app     # scaffold a new AXIOM/ATELIER app from source, no build needed
```

```bash
cd my-app
atl brief elicit                 # answer a few questions about the project
atl direct generate              # get direction candidates
atl direct choose dir_A          # freeze one
axm pipeline run                 # GENERATE through GREEN
axm deploy --env preview         # build + security audit + deploy
```

## Command surface

| Command | Does |
|---|---|
| `axm init <name>` | Scaffold a new app |
| `axm add component\|route\|store` | Generate + sidecar + test, deterministically |
| `axm pattern add\|list\|eject` | ATELIER motion/WebGL pattern library |
| `axm validate` | Check manifest, invariants, ownership, token references |
| `axm pipeline run [--stage]` | Run the full gate chain or one stage |
| `axm heal --auto` | Retry loop for a red pipeline |
| `axm context slice --for <file>` | Minimal edit context for one file — what an agent actually needs to see |
| `axm split <file> --at <export\|line>` | Extract when a file grows past budget |
| `atl brief\|direct\|critic\|deploy` | ATELIER's Brief→Direction→Build→Critic workflow |
| `atelier-mcp` | The same workflow, exposed as MCP tools |

Every command accepts `--json`, none prompt interactively, and running the same command twice on the same input produces byte-identical output — that last part is a tested property, not a hope.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript 5 (`strict`, `noUncheckedIndexedAccess`) · Tailwind v4 · GSAP + React Three Fiber behind core wrappers · Zustand 5 · Zod 4 · Hono 4 · Drizzle ORM · PGlite locally / Postgres in prod · Vitest 3 · Playwright + axe-core · ESLint 9 flat config with a custom invariant-enforcement plugin.

Every choice optimizes for one thing: the highest LLM training-data coverage available, to minimize hallucinated APIs.

## Status

| Milestone | State |
|---|---|
| AXIOM M0–M12 | GREEN |
| ATELIER A0–A7 | GREEN |
| ATELIER A8 — Track-A (curated) | GREEN, end-to-end incl. deploy + CRITIC |
| ATELIER A8 — Track-B (bespoke) | GREEN, end-to-end, verified alongside Track-A |

Getting Track-B green surfaced thirteen framework defects along the way — the interesting ones all shared one root cause: a gate checking an artifact's *shape* without ever checking its *runtime effect*. Full writeup, including what was tried and rejected and why: [`docs/superpowers/plans/2026-07-12-atelier-a8-acceptance.md`](docs/superpowers/plans/2026-07-12-atelier-a8-acceptance.md).

## Repo layout

```
src/cli/
├── commands/     CLI command implementations + tests
├── generators/   Codegen for components, routes, stores, tokens, patterns
├── manifest/     Ownership enforcement, integrity hashing
├── validate/     Invariant/a11y/motion rule maps
├── pipeline/     Stage runner: GENERATE → ... → GREEN
├── critic/       ATELIER anti-template heuristic
├── presets/      ATELIER curated-track direction presets
├── mcp/          atelier-mcp server
└── templates/    Source the generators stamp out

apps/craft-prototype/   Standalone Vite/React demo — separate workspace
```

## Developing on AXIOM itself

```bash
pnpm test                                              # unit — run files individually under load; see acceptance doc
pnpm vitest run --config vitest.integration.config.ts <file>   # integration — sequentially, they scaffold real apps
```

`AGENTS.md` is the deeper, German-language source of truth for agents working in this repo — invariant table, CLI contract, and known exceptions in full. `CLAUDE.md` is the shorter onboarding doc for Claude Code specifically.
