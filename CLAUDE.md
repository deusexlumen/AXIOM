# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AXIOM is a framework for deterministic, agent-native web infrastructure — a CLI (`axm`, alias `atl` for the ATELIER extension) that scaffolds and enforces a Next.js/React app whose structure and invariants are machine-checked rather than convention-based. ATELIER is a Brief→Direction→Build design pipeline built on top of AXIOM (curated campaign pages and bespoke portfolios).

Two independent things live in this repo:
- **Root** (`src/cli/`): the AXIOM/ATELIER framework itself — the CLI, generators, pipeline, MCP server. This is the actual product.
- **`apps/craft-prototype/`**: a standalone Vite/React demo app with its own `pnpm-workspace.yaml`, isolated from the root workspace and root vitest config.

Current specs: `AXIOM_SPEC_v2.0.md` (supersedes v1.0) and `ATELIER_SPEC_v3.0.md`. `AGENTS.md` at the repo root is the canonical, German-language agent-onboarding doc — read it for full detail on invariants, CLI contract, and ownership zones; this file summarizes what's needed to be productive without duplicating it.

## Commands

```bash
pnpm install                 # install deps (pnpm 9, Node >=22)
pnpm build                   # tsc && tsc-alias -> dist/
pnpm test                    # vitest run --reporter=json -> pipeline/reports/vitest.json
pnpm test:integration        # runs the *.integration.test.ts suite via vitest.integration.config.ts
pnpm dev                     # tsx src/cli/bin.ts (run the CLI from source, no build step)
```

Single test file: `pnpm vitest run src/cli/commands/init.test.ts`
Single integration test: `pnpm vitest run --config vitest.integration.config.ts src/cli/commands/init.integration.test.ts`
ESLint plugin package tests: `cd packages/eslint-plugin-axiom && pnpm test`

Note: `vitest.config.ts` excludes `apps/**`, `.worktrees/**`, and `packages/**` — root `pnpm test` never touches the craft-prototype app or the ESLint plugin. To work on `apps/craft-prototype`, `cd` into it first (it has its own `vitest.config.ts`, `playwright.config.ts`, and lockfile).

There is no lint/typecheck npm script at the root — invariant/lint enforcement happens through the `axm`/`atl` CLI itself (`pnpm dev validate`, `pnpm dev pipeline`), not through a separate `pnpm lint`.

## Architecture

### The CLI is the only mutation path

`src/cli/bin.ts` dispatches `argv[2]` through `src/cli/commands/registry.ts`, a flat `Record<string, Handler>`. Every top-level command name (`init`, `validate`, `pipeline`, `heal`, `add`, `pattern`, `assets`, `tokens`, `motion`, `direct`, `brief`, `api`, `db`, `context`, `split`, `plan`, `order`, `lease`, `conduct`, `ledger`, `bench`, `audit`, `critic`, `deps`, `deploy`) is registered there; subcommand routing (e.g. `add component|route|store`) lives in `src/cli/bin-commands.ts`. All output is NDJSON; all errors are `FIX_PACKET`s built via `cliFixPacket()` in `src/cli/errors.ts` with an `AXM-*` error code and a semantic exit code from `ExitCode` in `src/cli/types.ts`.

When adding a new CLI command: write the handler in `src/cli/commands/<name>.ts`, register it in `registry.ts`, and give it a co-located `<name>.test.ts` (unit) and, if it touches the filesystem/DB/network, a `<name>.integration.test.ts`.

### Ownership zones (enforced, not advisory)

Every file/directory in a generated AXIOM app belongs to exactly one zone:
- **LOCKED** — framework-owned; agent writes fail the pipeline (`AXM-V010`).
- **MACHINE** — only the CLI may write; direct edits break the SHA-256 integrity hash (`AXM-V011`). Tracked in `agent-context.json`.
- **AGENT** — free write zone, still subject to the invariant table below.
- **OPERATOR** — human-edited; agents touch it only via an explicit CLI command.

`src/cli/manifest/` (`integrity.ts`, `ownership.ts`, `hash.ts`, `reader.ts`, `writer.ts`, `mutate.ts`) implements this — read it before writing anything that mutates a generated app's files.

### Machine-enforced invariants (I-01…I-13)

Generated app code is constrained by rules like: max 120 LOC per file, max 4096 bytes per source file, exactly one named export per component file, no default exports (except generated route wrappers / config files that a tool like Vite/ESLint mandates), no barrel files, imports only via the `@/` alias, every component has a sidecar `<Name>.spec.json`, no raw color/pixel values (tokens only), no `any`/`@ts-ignore`/`eslint-disable`, no dynamic imports with variable paths, every component root renders `data-axm-id="<Name>"`. Full table and known exceptions are in `AGENTS.md`. `packages/eslint-plugin-axiom` is the ESLint 9 flat-config plugin (`src/rules/`) that enforces the code-shape invariants at lint time.

### Pipeline state machine

`src/cli/pipeline/runner.ts` drives stages defined in `src/cli/pipeline/stages/` in order: `GENERATE → VALIDATE → TYPECHECK → LINT → UNIT → E2E → GREEN` (plus `perf`, `critic`, `contract`, `build` stages used by ATELIER). It is fail-fast (stops at first red stage), retries up to 3 times, then escalates via a `FIX_PACKET`. `--scope <component>` isolates testing to a component and its `usedBy` chain; E2E only runs on route changes or with `--stage e2e` explicit.

### Layer map inside `src/cli/`

| Dir | Responsibility |
|---|---|
| `commands/` | CLI command implementations + their tests (largest directory — one file/pair per command or subcommand) |
| `generators/` | Codegen for components, routes, stores, tokens, motion, and ATELIER patterns (`pattern-nav-*`, `pattern-scroll-*`, `pattern-typo-*`, `pattern-webgl-*`) |
| `manifest/` | `agent-context.json` read/write, ownership enforcement, integrity hashing |
| `validate/` | Rule maps (`rule-map-invariants.ts`, `rule-map-a11y.ts`, `rule-map-motion.ts`), lint + content checks, ledger of violations |
| `pipeline/` | Stage runner and the individual GENERATE→GREEN stage implementations |
| `heal/` | Self-healing retry loop (`axm heal --auto`) |
| `critic/` | ATELIER anti-template heuristic / design critique stage |
| `presets/` | ATELIER curated-track presets (Direction/Tokens/Motion/Pattern bundles) |
| `elicitation/` | ATELIER Brief-workflow Q&A |
| `mcp/` | `atelier-mcp` MCP server (`server.ts`, `tools.ts`) — exposes the ATELIER workflow as MCP tools |
| `leases/`, `ledger/` | Multi-agent work coordination: leases (claim/heartbeat/reclaim scope), ledger (cost tracking, enforcement) — backs the `order`/`lease`/`conduct`/`ledger` commands for parallel-agent orchestration |
| `api/`, `schemas/` (under `templates/`) | Zod → OpenAPI 3.1 generation for the generated app's API layer (Hono + Drizzle) |
| `security/` | Security-related checks used by `audit` |
| `fixtures/` | Deterministic test fixtures, including full reference projects (`track-a-campaign/`, `track-b-portfolio/`) — excluded from `tsc`/vitest globs, only pulled in explicitly by tests that need them |
| `templates/` | Source templates the generators stamp out (Next.js app scaffold, configs, `core/` runtime wrappers like `useChoreo`) |

### Determinism is a hard requirement

`axm init` and `axm add component` must produce byte-identical output for identical input — this is tested directly (see `*.property.test.ts` using `fast-check`, e.g. `manifest/agent-context.property.test.ts`). Don't introduce timestamps, random IDs, or unordered iteration into anything the CLI writes to disk without checking whether a determinism test already covers it.

### Stack (root CLI package)

Node 22, pnpm 9, TypeScript 5.9 (`strict: true`, `noUncheckedIndexedAccess: true`, `NodeNext` module resolution, path alias `@/*` → `./src/*`), Zod 4 (note: schema files under `src/cli/schemas/*.ts` import `z` from `zod/v3` specifically as a workaround for `zod-to-json-schema` typing against v3 — the runtime is still zod@4), ts-morph for AST codemods, Vitest 3 with JSON reporter, Playwright + axe-core for E2E, Hono 4 + Drizzle ORM + PGlite (local)/PostgreSQL (prod) for the generated app's API/DB layer, `@modelcontextprotocol/sdk` for the MCP server.

## Gotchas

- Root `pnpm test` silently skips `apps/`, `packages/`, and `.worktrees/` — a failing test in `craft-prototype` or `eslint-plugin-axiom` will not show up there. Run those workspaces' own `pnpm test` separately.
- `.worktrees/` contains full parallel checkouts (m0, m1, m2, ...) used for milestone work — don't assume `src/` at repo root is the only copy of the codebase when searching broadly.
- Files under `src/cli/fixtures/` and `src/cli/templates/` are excluded from the root `tsconfig.json` and from vitest's default include — they're either committed byte-identical golden output or raw stamp-out templates, not code that gets typechecked as project source.
- The `zod/v3` import in schema files (see Stack note above) is intentional, not a stray leftover — don't "fix" it to `zod` without checking `AGENTS.md`'s "Bekannte M1-Ausnahmen" section first.
- `AGENTS.md` is the deeper source of truth and is in German; when it and this file appear to disagree, treat `AGENTS.md` as authoritative for invariants/CLI-contract details and update this file to match.
