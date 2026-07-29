import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { DbContext } from "@/cli/schemas/db.js";
import type { PipelineReport } from "@/cli/pipeline/types.js";

export function captureStream(): { stream: NodeJS.WritableStream; output: () => string } {
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

export function baseContext(): AgentContext {
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

export async function makeProject(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "axiom-deploy-test-"));
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "demo", version: "1.0.0" }, null, 2)}\n`
  );
  writeFileSync(join(dir, "tokens.json"), "{}");
  await writeAgentContext(dir, baseContext());
  mkdirSync(join(dir, "db/migrations"), { recursive: true });
  writeFileSync(join(dir, "db/migrations/0000_init.sql"), "CREATE TABLE t (id INT);");
  const context = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
  const hash = await hashFile(join(dir, "db/migrations/0000_init.sql"));
  const db: DbContext = {
    schemaFiles: [],
    migrationHead: "0000_init.sql",
    migrationHashes: { "0000_init.sql": hash },
  };
  context.db = db;
  await writeAgentContext(dir, context);
  return dir;
}

export const noopAudit = async (): Promise<void> => {};
export const greenPipeline = async (): Promise<PipelineReport> => ({
  runId: "run_1",
  result: "GREEN",
  failedStage: null,
  packetFile: null,
});
export const redPipeline = async (): Promise<PipelineReport> => ({
  runId: "run_1",
  result: "RED",
  failedStage: "validate",
  packetFile: null,
});
export const mockVercel = (): string => "https://demo.example.com";

export function cleanProject(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
