# M4 Pipeline State Machine + `axm heal` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `axm pipeline run` with stages `GENERATE → VALIDATE → TYPECHECK → LINT → UNIT → E2E → GREEN`, normalize every stage failure into a schema-valid FIX_PACKET, provide 10 error fixtures proving the correct `errorCode`, and implement `axm heal --auto` with ack-polling, retry hygiene (`lastAttemptDiff`), and escalation after 3 attempts.

**Architecture:** A pure pipeline runner (`src/cli/pipeline/runner.ts`) executes a configured list of stages. Each stage is a function `Stage = (cwd, context, scope?) => Promise<StageResult>` where `StageResult` is either `{ ok: true }` or `{ ok: false, packet: FixPacket }`. Stage adapters live in `src/cli/pipeline/stages/` and wrap external tools (`tsc`, `eslint`, `vitest`, `playwright`). The runner appends each emitted FIX_PACKET to `pipeline/fix-packets/<runId>.ndjson`, updates the component status in `agent-context.json`, and stops at the first red stage. `axm heal --auto` invokes the runner, emits the packet, then polls `pipeline/ack/<packetId>` at 500 ms intervals; on ack it re-runs with `attempt.current` incremented and `lastAttemptDiff` populated from a simple before/after hash of the target file. After `maxRetries` it writes an ESCALATION_REPORT to `pipeline/reports/escalation_<runId>.json` and exits 50.

**Tech Stack:** TypeScript 5, Node.js `child_process`, `execa`, `vitest` JSON reporter, `eslint` JSON/stylish reporter, `tsc` pretty/JSON output, `playwright` JSON reporter, `axe-core`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/cli/pipeline/types.ts` | `Stage`, `StageResult`, `PipelineOptions`, `PipelineReport`. |
| `src/cli/pipeline/runner.ts` | `runPipeline(cwd, options)` — orchestrates stages, writes reports/fix-packets, updates manifest status. |
| `src/cli/pipeline/stages/validate.ts` | Reuses `validate()` but converts thrown `CliError` into a FIX_PACKET. |
| `src/cli/pipeline/stages/typecheck.ts` | Runs `tsc --noEmit --pretty false` and parses output into `AXM-T001`. |
| `src/cli/pipeline/stages/lint.ts` | Runs `eslint . --format json` and parses first `axiom/*` or TS error into `AXM-L001`. |
| `src/cli/pipeline/stages/unit.ts` | Runs `vitest run --reporter=json` and parses first failure into `AXM-U001`. |
| `src/cli/pipeline/stages/e2e.ts` | Runs `playwright test --reporter=json` and parses first failure/axe violation into `AXM-E001`/`AXM-E010`. |
| `src/cli/pipeline/packet.ts` | Helpers to build pipeline FIX_PACKETs (`buildPipelinePacket`, `buildEscalationReport`). |
| `src/cli/pipeline/scope.ts` | Resolves component + `usedBy` chain for `--scope`. |
| `src/cli/commands/pipeline.ts` | `pipelineCommand(args)` and `runPipelineCommand`. |
| `src/cli/commands/heal.ts` | `healCommand(args)` — auto heal loop with ack polling. |
| `src/cli/bin.ts` | Wire `pipeline` and `heal` commands. |
| `src/cli/commands/pipeline.integration.test.ts` | 10 error fixtures for pipeline stages. |
| `src/cli/commands/heal.integration.test.ts` | Retry and escalation fixtures for `heal --auto`. |

---

### Task 1: Pipeline types and runner skeleton

**Files:**
- Create: `src/cli/pipeline/types.ts`
- Create: `src/cli/pipeline/runner.ts`
- Test: `src/cli/pipeline/runner.test.ts`

- [ ] **Step 1: Define types**

`src/cli/pipeline/types.ts`:
```ts
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export type StageName = "generate" | "validate" | "typecheck" | "lint" | "unit" | "e2e";

export interface StageResult {
  ok: boolean;
  packet?: FixPacket;
}

export interface Stage {
  name: StageName;
  run(cwd: string, scope?: string[]): Promise<StageResult>;
}

export interface PipelineOptions {
  scope?: string;
  stage?: StageName;
  out?: NodeJS.WritableStream;
}

export interface PipelineReport {
  runId: string;
  result: "GREEN" | "RED";
  failedStage: StageName | null;
  packetFile: string | null;
}
```

- [ ] **Step 2: Implement runner**

`src/cli/pipeline/runner.ts`:
```ts
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { result } from "@/cli/utils/ndjson.js";
import type { Stage, PipelineOptions, PipelineReport, StageName } from "@/cli/pipeline/types.js";

export async function runPipeline(
  cwd: string,
  stages: Stage[],
  options: PipelineOptions = {}
): Promise<PipelineReport> {
  const runId = `run_${Date.now()}`;
  const report: PipelineReport = { runId, result: "GREEN", failedStage: null, packetFile: null };
  await mkdir(resolve(cwd, "pipeline", "fix-packets"), { recursive: true });

  for (const stage of stages) {
    if (options.stage && stage.name !== options.stage) continue;
    const stageResult = await stage.run(cwd, options.scope ? [options.scope] : undefined);
    if (!stageResult.ok) {
      report.result = "RED";
      report.failedStage = stage.name;
      if (stageResult.packet) {
        const packetFile = `pipeline/fix-packets/${runId}.ndjson`;
        await appendPacket(resolve(cwd, packetFile), stageResult.packet);
        report.packetFile = packetFile;
      }
      break;
    }
  }

  result({ ok: report.result === "GREEN", report }, options.out);
  return report;
}

async function appendPacket(path: string, packet: unknown): Promise<void> {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(path, `${JSON.stringify(packet)}\n`);
}
```

- [ ] **Step 3: Write runner test**

```ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPipeline } from "@/cli/pipeline/runner.js";

describe("runPipeline", () => {
  it("returns GREEN when all stages pass", async () => {
    const stages = [{ name: "validate" as const, run: async () => ({ ok: true }) }];
    const report = await runPipeline(tmpdir(), stages);
    expect(report.result).toBe("GREEN");
  });

  it("stops at first red stage and returns RED", async () => {
    const stages = [
      { name: "validate" as const, run: async () => ({ ok: false, packet: { errorCode: "AXM-V001" } }) },
      { name: "typecheck" as const, run: async () => ({ ok: true }) },
    ];
    const report = await runPipeline(tmpdir(), stages);
    expect(report.result).toBe("RED");
    expect(report.failedStage).toBe("validate");
  });
});
```

- [ ] **Step 4: Run test**

Run: `pnpm test src/cli/pipeline/runner.test.ts`
Expected: PASS.

---

### Task 2: VALIDATE stage

**Files:**
- Create: `src/cli/pipeline/stages/validate.ts`
- Test: `src/cli/pipeline/stages/validate.test.ts`

- [ ] **Step 1: Implement stage**

`src/cli/pipeline/stages/validate.ts`:
```ts
import { validate } from "@/cli/commands/validate.js";
import { CliError } from "@/cli/errors.js";
import type { StageResult } from "@/cli/pipeline/types.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export async function runValidateStage(cwd: string): Promise<StageResult> {
  try {
    await validate(cwd);
    return { ok: true };
  } catch (error) {
    if (error instanceof CliError) {
      return { ok: false, packet: JSON.parse(error.message) as FixPacket };
    }
    throw error;
  }
}
```

- [ ] **Step 2: Test**

Create a temp dir with invalid agent-context.json, run stage, assert `ok === false` and `packet.errorCode` starts with `AXM-V`.

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/pipeline/stages/validate.test.ts`
Expected: PASS.

---

### Task 3: TYPECHECK stage

**Files:**
- Create: `src/cli/pipeline/stages/typecheck.ts`
- Create: `src/cli/pipeline/packet.ts` (if not already)
- Test: `src/cli/pipeline/stages/typecheck.test.ts`

- [ ] **Step 1: Implement parser**

`src/cli/pipeline/stages/typecheck.ts`:
```ts
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runTypecheckStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm tsc --noEmit --pretty false", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stderr = String((error as { stderr?: Buffer }).stderr ?? "");
    const first = stderr.split("\n").find((l) => l.includes("error TS")) ?? stderr.split("\n")[0] ?? "TypeScript error";
    const match = first.match(/(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/);
    const file = match?.[1]?.trim() ?? "src/components/Unknown.tsx";
    const line = Number(match?.[2] ?? 1);
    const column = Number(match?.[3] ?? 1);
    const tsCode = match?.[4] ?? "TS0000";
    const message = match?.[5] ?? first;
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-T001", message, file, line, column, "typecheck", ["I-09"], tsCode),
    };
  }
}
```

- [ ] **Step 2: Implement packet builder**

`src/cli/pipeline/packet.ts`:
```ts
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export function buildPipelinePacket(
  errorCode: string,
  message: string,
  file: string,
  line: number,
  column: number,
  stage: string,
  invariants: string[],
  rawEvidence: Record<string, unknown> = {}
): FixPacket {
  return {
    packetId: `${errorCode.toLowerCase()}_${Date.now()}`,
    runId: "pipeline",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage,
    severity: "BLOCKING",
    target: { file, line, column },
    message,
    rawEvidence,
    probableCause: `Pipeline stage ${stage} failed.`,
    fixHint: `Run the failing stage locally to inspect details.`,
    invariantsAffected: invariants,
    agentInstruction: `Correct ${file} and re-run axm pipeline run.`,
  };
}
```

- [ ] **Step 3: Test**

Create a temp AXIOM app, introduce a TS error in a component, run stage, assert `ok === false` and `errorCode === "AXM-T001"`.

- [ ] **Step 4: Run test**

Run: `pnpm test src/cli/pipeline/stages/typecheck.test.ts`
Expected: PASS.

---

### Task 4: LINT stage

**Files:**
- Create: `src/cli/pipeline/stages/lint.ts`
- Test: `src/cli/pipeline/stages/lint.test.ts`

- [ ] **Step 1: Implement stage**

`src/cli/pipeline/stages/lint.ts`:
```ts
import { execSync } from "node:child_process";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runLintStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm eslint . --format json", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "[]");
    const results = JSON.parse(stdout) as Array<{ filePath: string; messages: Array<{ line: number; column: number; message: string; ruleId?: string }> }>;
    const firstResult = results.find((r) => r.messages.length > 0);
    const firstMessage = firstResult?.messages[0];
    if (!firstResult || !firstMessage) {
      return { ok: false, packet: buildPipelinePacket("AXM-L001", "ESLint failed", "src/components/Unknown.tsx", 1, 1, "lint", ["I-09"]) };
    }
    return {
      ok: false,
      packet: buildPipelinePacket(
        "AXM-L001",
        `${firstMessage.ruleId ?? "eslint"}: ${firstMessage.message}`,
        firstResult.filePath.replace(/\\/g, "/").replace(`${cwd.replace(/\\/g, "/")}/`, ""),
        firstMessage.line,
        firstMessage.column,
        "lint",
        ["I-01", "I-04", "I-05", "I-06", "I-08", "I-09", "I-12"],
        { ruleId: firstMessage.ruleId }
      ),
    };
  }
}
```

- [ ] **Step 2: Test**

Create temp app with a component that has a relative import, run stage, assert `AXM-L001`.

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/pipeline/stages/lint.test.ts`
Expected: PASS.

---

### Task 5: UNIT stage

**Files:**
- Create: `src/cli/pipeline/stages/unit.ts`
- Test: `src/cli/pipeline/stages/unit.test.ts`

- [ ] **Step 1: Implement stage**

`src/cli/pipeline/stages/unit.ts`:
```ts
import { execSync } from "node:child_process";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runUnitStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm vitest run --reporter=json", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "{}");
    const report = JSON.parse(stdout);
    const failed = report.testResults?.find((r: { status: string }) => r.status === "failed");
    const first = failed?.assertionResults?.find((a: { status: string }) => a.status === "failed");
    const file = failed?.name ?? "src/components/Unknown.test.tsx";
    const message = first?.failureMessages?.[0]?.split("\n")[0] ?? "Unit test failed";
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-U001", message, file, first?.location?.line ?? 1, 1, "unit", ["I-07"], { testName: first?.fullName }),
    };
  }
}
```

- [ ] **Step 2: Test**

Create temp app with a failing test, run stage, assert `AXM-U001`.

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/pipeline/stages/unit.test.ts`
Expected: PASS.

---

### Task 6: E2E stage

**Files:**
- Create: `src/cli/pipeline/stages/e2e.ts`
- Test: `src/cli/pipeline/stages/e2e.test.ts`

- [ ] **Step 1: Implement stage**

`src/cli/pipeline/stages/e2e.ts`:
```ts
import { execSync } from "node:child_process";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runE2eStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm playwright test --reporter=json", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "{}") || "{}";
    const report = JSON.parse(stdout);
    const suite = report.suites?.find((s: { specs: Array<{ ok: boolean; title: string }> }) => s.specs?.some((sp) => !sp.ok));
    const spec = suite?.specs?.find((sp: { ok: boolean }) => !sp.ok);
    const file = suite?.file ?? "e2e/Unknown.spec.ts";
    const message = spec?.tests?.[0]?.results?.[0]?.error?.message ?? "E2E test failed";
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-E001", message, file, 1, 1, "e2e", ["I-13"], { testName: spec?.title }),
    };
  }
}
```

- [ ] **Step 2: Test**

Skip detailed Playwright fixture for now; write a test that a stub failing report parses. Full E2E fixture is Task 7.

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/pipeline/stages/e2e.test.ts`
Expected: PASS.

---

### Task 7: `axm pipeline run` command

**Files:**
- Create: `src/cli/commands/pipeline.ts`
- Modify: `src/cli/bin.ts`

- [ ] **Step 1: Implement command**

`src/cli/commands/pipeline.ts`:
```ts
import { resolve } from "node:path";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { runValidateStage } from "@/cli/pipeline/stages/validate.js";
import { runTypecheckStage } from "@/cli/pipeline/stages/typecheck.js";
import { runLintStage } from "@/cli/pipeline/stages/lint.js";
import { runUnitStage } from "@/cli/pipeline/stages/unit.js";
import { runE2eStage } from "@/cli/pipeline/stages/e2e.js";
import type { Stage, StageName } from "@/cli/pipeline/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

const STAGES: Stage[] = [
  { name: "validate", run: runValidateStage },
  { name: "typecheck", run: runTypecheckStage },
  { name: "lint", run: runLintStage },
  { name: "unit", run: runUnitStage },
  { name: "e2e", run: runE2eStage },
];

export async function pipelineCommand(args: string[]): Promise<void> {
  const cwd = resolve(process.cwd(), args[0] ?? ".");
  const scopeIdx = args.indexOf("--scope");
  const scope = scopeIdx >= 0 ? args[scopeIdx + 1] : undefined;
  const stageIdx = args.indexOf("--stage");
  const stage = stageIdx >= 0 ? (args[stageIdx + 1] as StageName) : undefined;
  if (stage && !STAGES.some((s) => s.name === stage)) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Unknown stage: ${stage}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  await runPipeline(cwd, STAGES, { scope, stage });
}
```

- [ ] **Step 2: Wire bin.ts**

Add:
```ts
import { pipelineCommand } from "@/cli/commands/pipeline.js";

if (command === "pipeline") {
  await pipelineCommand(args);
  return ExitCode.OK;
}
```

- [ ] **Step 3: Run a smoke test**

Run:
```bash
pnpm build
node dist/cli/bin.js init /tmp/axiom-pipeline-smoke --skip-install
node /tmp/axiom-pipeline-smoke/node_modules/.bin/axm?  # use absolute path
# actually run from smoke dir:
cd /tmp/axiom-pipeline-smoke
node /c/Users/Buxe/Projects/AXIOM/.worktrees/m2/dist/cli/bin.js pipeline run --stage validate
```
Expected: NDJSON result with `ok: true` and `result: GREEN`.

---

### Task 8: 10 error fixtures

**Files:**
- Create: `src/cli/commands/pipeline.integration.test.ts`

- [ ] **Step 1: Write fixtures**

For each of the following, scaffold an app, introduce the error, run `axm pipeline run`, and assert the resulting FIX_PACKET error code:

1. `AXM-V001` — component >120 LOC (validate stage).
2. `AXM-V002` — component >4096 bytes (validate stage).
3. `AXM-T001` — TypeScript type error (typecheck stage).
4. `AXM-L001` — ESLint rule violation e.g. relative import (lint stage).
5. `AXM-U001` — failing unit test (unit stage).
6. `AXM-E001` — failing E2E test (e2e stage). Skip if Playwright not installed; otherwise generate a minimal failing spec.
7. `AXM-V004` — default export in component (validate/lint).
8. `AXM-V006` — relative import in component (lint).
9. `AXM-V008` — raw color value (lint).
10. `AXM-V009` — `// @ts-ignore` in component (lint).

Use helpers from `validate.integration.helpers.ts` and add pipeline helpers as needed. Each test should run the pipeline via `execa` against a temp app dir and parse the last NDJSON line.

- [ ] **Step 2: Update package.json integration script**

Add `src/cli/commands/pipeline.integration.test.ts` to the `test:integration` script.

- [ ] **Step 3: Run integration tests**

Run: `pnpm run test:integration`
Expected: all 10 fixtures pass.

---

### Task 9: `axm heal --auto`

**Files:**
- Create: `src/cli/commands/heal.ts`
- Modify: `src/cli/bin.ts`
- Create: `src/cli/commands/heal.integration.test.ts`

- [ ] **Step 1: Implement heal command**

`src/cli/commands/heal.ts`:
```ts
import { resolve } from "node:path";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { STAGES } from "@/cli/commands/pipeline.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export interface HealOptions {
  cwd?: string;
  maxRetries?: number;
  out?: NodeJS.WritableStream;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function healCommand(options: HealOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const maxRetries = options.maxRetries ?? 3;
  await mkdir(resolve(cwd, "pipeline", "ack"), { recursive: true });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const report = await runPipeline(cwd, STAGES, { out: options.out });
    if (report.result === "GREEN") {
      result({ ok: true, healedAtAttempt: attempt }, options.out);
      return;
    }

    const packetFile = report.packetFile ? resolve(cwd, report.packetFile) : null;
    const packet: FixPacket | null = packetFile && existsSync(packetFile)
      ? JSON.parse((await readFile(packetFile, "utf-8")).trim().split("\n").pop()!)
      : null;

    if (!packet) {
      throw new CliError(JSON.stringify(cliFixPacket("AXM-I001", "Pipeline failed but no FIX_PACKET emitted", ["I-11"])), ExitCode.INTERNAL_ERROR);
    }

    packet.attempt = { current: attempt, max: maxRetries };
    if (attempt > 1) {
      packet.lastAttemptDiff = await computeLastAttemptDiff(cwd, packet.target.file);
    }
    result({ ok: false, packet }, options.out);

    if (attempt === maxRetries) break;

    const ackPath = resolve(cwd, "pipeline", "ack", packet.packetId);
    const targetPath = resolve(cwd, packet.target.file);
    const beforeHash = await hashFile(targetPath);
    let waited = 0;
    while (!existsSync(ackPath)) {
      await sleep(500);
      waited += 500;
      if (waited > 60_000) {
        throw new CliError(JSON.stringify(cliFixPacket("AXM-I001", "Heal ack timeout", ["I-11"])), ExitCode.INTERNAL_ERROR);
      }
    }
    const afterHash = await hashFile(targetPath);
    if (beforeHash === afterHash) {
      throw new CliError(JSON.stringify(cliFixPacket("AXM-I001", "Heal ack received but target file unchanged", ["I-11"])), ExitCode.INTERNAL_ERROR);
    }
  }

  await writeEscalationReport(cwd);
  throw new CliError(JSON.stringify(cliFixPacket("AXM-I001", "Max retries exceeded; escalation report written", ["I-11"])), ExitCode.INTERNAL_ERROR);
}
```

Helpers `computeLastAttemptDiff`, `hashFile`, `writeEscalationReport` need to be implemented in the same file or in helpers. Keep the main file under 120 LOC by extracting helpers to `src/cli/commands/heal-helpers.ts`.

- [ ] **Step 2: Wire bin.ts**

Add:
```ts
import { healCommand } from "@/cli/commands/heal.js";

if (command === "heal") {
  const maxRetriesIdx = args.indexOf("--max-retries");
  const maxRetries = maxRetriesIdx >= 0 ? Number(args[maxRetriesIdx + 1]) : undefined;
  await healCommand({ maxRetries });
  return ExitCode.OK;
}
```

- [ ] **Step 3: Write heal integration test**

Test 1: `heal --auto` succeeds on first attempt if pipeline is green.
Test 2: `heal --auto` emits FIX_PACKET, agent writes ack + fixes file, second run is green; verify `attempt.current === 1` in emitted packet and no escalation.
Test 3: `heal --auto` with max-retries 2 fails twice, writes escalation report, exits 50.

- [ ] **Step 4: Run integration tests**

Run: `pnpm run test:integration`
Expected: all pass.

---

### Task 10: Final verification

- [ ] **Step 1: Full build + test suite**

Run:
```bash
pnpm build
pnpm test
pnpm run test:integration
```
Expected: all green.

- [ ] **Step 2: Budget checks**

Run:
```bash
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -n | tail -20
```
Expected: no file >120 LOC.

- [ ] **Step 3: Forbidden patterns**

Run:
```bash
grep -R "\bany\b\|@ts-ignore\|eslint-disable" src/cli/pipeline src/cli/commands/pipeline.ts src/cli/commands/heal.ts || true
```
Expected: no matches.

---

## Self-Review Checklist

- [ ] Spec coverage: pipeline state machine, fail-fast, stage skipping (`--stage`), error normalization for TS/Lint/Unit/E2E, 10 fixtures, `axm heal --auto`, ack-polling, retry hygiene (`lastAttemptDiff`), escalation report, exit 50 all map to tasks.
- [ ] No placeholders: every task contains concrete code/commands.
- [ ] Type consistency: `Stage`, `StageResult`, `FixPacket`, `PipelineReport` names match across files.
- [ ] No AGENT edits to LOCKED/MACHINE zones: reports and fix-packets go to MACHINE directories; the CLI writes them.
