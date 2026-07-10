import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { depsAdd } from "@/cli/commands/deps-add.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashString } from "@/cli/manifest/hash.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

function captureStream(): { stream: NodeJS.WritableStream; output: () => string } {
  let data = "";
  return {
    stream: new Writable({
      write(chunk, _encoding, callback) {
        data += chunk.toString();
        callback();
      },
    }),
    output: () => data,
  };
}

function baseContext(): AgentContext {
  return {
    axiomVersion: "1.0.0",
    project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: hashString("{}") },
    integrity: { lockedFiles: {}, machineFiles: {} },
    pipeline: { lastRun: null },
  } as AgentContext;
}

async function makeProject(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "axiom-deps-test-"));
  writeFileSync(join(dir, "package.json"), `${JSON.stringify({ name: "demo", version: "1.0.0" }, null, 2)}\n`);
  writeFileSync(join(dir, "tokens.json"), "{}");
  await writeAgentContext(dir, baseContext());
  return dir;
}

describe("depsAdd", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("adds a dependency by editing package.json and records the lockfile hash", async () => {
    const cap = captureStream();
    await depsAdd(["zod@3.0.0"], { cwd: dir, noPnpm: true, out: cap.stream });
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8")) as Record<string, unknown>;
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps.zod).toBe("3.0.0");
    const lines = cap.output().trim().split("\n");
    const line = JSON.parse(lines[lines.length - 1]!);
    expect(line.data.added).toBe("zod@3.0.0");
  });

  it("rejects forbidden dependencies from the ledger", async () => {
    mkdirSync(join(dir, "ledger"));
    writeFileSync(
      join(dir, "ledger/decisions.ndjson"),
      `${JSON.stringify({
        id: "DEC-0001",
        date: new Date().toISOString(),
        scope: "deps",
        decision: "forbid lodash",
        rationale: "security",
        class: "enforced",
        rule: { type: "forbidden-dependency", match: ["lodash"] },
        supersedes: null,
      })}\n`
    );
    await expect(depsAdd(["lodash@4.17.21"], { cwd: dir, noPnpm: true })).rejects.toMatchObject({
      exitCode: ExitCode.LEDGER_ERROR,
    });
  });
});
