import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { Writable } from "node:stream";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { PipelineReport } from "@/cli/heal/types.js";

export function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

export function baseContext(): AgentContext {
  return {
    axiomVersion: "1.0.0",
    project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: "sha256:token" },
    integrity: {
      lockedFiles: { "src/core/router.ts": "sha256:locked" },
      machineFiles: { ".github/workflows/axiom.yml": "sha256:machine" },
    },
    pipeline: { lastRun: null },
  };
}

export function packet(target: string): FixPacket {
  return {
    packetId: "p1",
    runId: "r1",
    attempt: { current: 1, max: 3 },
    errorCode: "AXM-V001",
    stage: "validate",
    severity: "BLOCKING",
    target: { file: target },
    message: "fail",
    rawEvidence: {},
    probableCause: "x",
    fixHint: "y",
    invariantsAffected: ["I-01"],
    agentInstruction: "fix",
  };
}

export function mockFetch(response: unknown): typeof fetch {
  return async () => ({ ok: true, json: async () => response }) as unknown as Response;
}

export function greenRun(): PipelineReport {
  return { result: "GREEN", packetFile: null };
}

export function redRun(dir: string, runId: string): PipelineReport {
  const packetDir = join(dir, "pipeline", "fix-packets");
  mkdirSync(packetDir, { recursive: true });
  const file = `pipeline/fix-packets/run_${runId}.ndjson`;
  writeFileSync(join(dir, file), `${JSON.stringify({ ...packet("src/components/Box.tsx"), runId })}\n`);
  return { result: "RED", packetFile: file };
}

export async function writeHeadlessFixture(
  dir: string,
  enabled: boolean,
  target: string,
  response: unknown,
  maxRetries = 3
): Promise<typeof fetch> {
  const config = {
    budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries },
    pipeline: { stages: ["validate", "typecheck", "lint", "unit"], e2eOn: "never" },
    context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    ci: { headlessHeal: { enabled } },
  };
  await writeFile(join(dir, "axiom.config.json"), JSON.stringify(config, null, 2));
  await writeAgentContext(dir, baseContext());
  const packetDir = join(dir, "pipeline", "fix-packets");
  mkdirSync(packetDir, { recursive: true });
  await writeFile(join(packetDir, "p1.ndjson"), `${JSON.stringify(packet(target))}\n`);
  return mockFetch(response);
}
