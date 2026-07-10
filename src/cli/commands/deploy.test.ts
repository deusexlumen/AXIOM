import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { deployCommand } from "@/cli/commands/deploy.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { DbContext } from "@/cli/schemas/db.js";
import type { PipelineReport } from "@/cli/pipeline/types.js";

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
  const dir = mkdtempSync(join(tmpdir(), "axiom-deploy-test-"));
  writeFileSync(join(dir, "package.json"), `${JSON.stringify({ name: "demo", version: "1.0.0" }, null, 2)}\n`);
  writeFileSync(join(dir, "tokens.json"), "{}");
  await writeAgentContext(dir, baseContext());
  mkdirSync(join(dir, "db/migrations"), { recursive: true });
  writeFileSync(join(dir, "db/migrations/0000_init.sql"), "CREATE TABLE t (id INT);");
  const context = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
  const hash = await hashFile(join(dir, "db/migrations/0000_init.sql"));
  const db: DbContext = { schemaFiles: [], migrationHead: "0000_init.sql", migrationHashes: { "0000_init.sql": hash } };
  context.db = db;
  await writeAgentContext(dir, context);
  return dir;
}

const noopAudit = async (): Promise<void> => {};
const greenPipeline = async (): Promise<PipelineReport> => ({
  runId: "run_1",
  result: "GREEN",
  failedStage: null,
  packetFile: null,
});
const redPipeline = async (): Promise<PipelineReport> => ({
  runId: "run_1",
  result: "RED",
  failedStage: "validate",
  packetFile: null,
});
const mockVercel = (): string => "https://demo.example.com";

describe("deployCommand", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns awaitingVeto when a pre-deploy gate exists without approval", async () => {
    writeFileSync(
      join(dir, "VISION.axm.json"),
      JSON.stringify({
        visionId: "v1",
        goal: "g",
        entities: [],
        routes: [],
        constraints: [],
        priorities: [],
        vetoGates: ["pre-deploy"],
        budgets: { maxComponents: 10, maxEndpoints: 10, tokenCeilingTotal: 1000 },
      })
    );
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "local",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
      vercelDeployFn: mockVercel,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.awaitingVeto).toBe(true);
  });

  it("deploys when the pre-deploy veto is approved", async () => {
    mkdirSync(join(dir, "orders/active"), { recursive: true });
    writeFileSync(
      join(dir, "orders/active/pre-deploy.json"),
      JSON.stringify({ status: "APPROVED" })
    );
    writeFileSync(
      join(dir, "VISION.axm.json"),
      JSON.stringify({
        visionId: "v1",
        goal: "g",
        entities: [],
        routes: [],
        constraints: [],
        priorities: [],
        vetoGates: ["pre-deploy"],
        budgets: { maxComponents: 10, maxEndpoints: 10, tokenCeilingTotal: 1000 },
      })
    );
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "local",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
      vercelDeployFn: mockVercel,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.ok).toBe(true);
    expect(line.data.url).toBe("https://demo.example.com");
  });

  it("aborts when the pipeline is RED", async () => {
    await expect(
      deployCommand([], { cwd: dir, env: "local", audit: noopAudit, runPipelineFn: redPipeline })
    ).rejects.toMatchObject({ exitCode: ExitCode.VALIDATION_ERROR });
  });

  it("aborts on migration hash mismatch", async () => {
    const context = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
    context.db!.migrationHashes["0000_init.sql"] = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    await writeAgentContext(dir, context);
    await expect(
      deployCommand([], { cwd: dir, env: "local", audit: noopAudit, runPipelineFn: greenPipeline })
    ).rejects.toMatchObject({ exitCode: ExitCode.VALIDATION_ERROR });
  });
});
