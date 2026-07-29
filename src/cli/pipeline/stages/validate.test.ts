import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runValidateStage } from "@/cli/pipeline/stages/validate.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile } from "@/cli/manifest/hash.js";

const baseContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:aa" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

describe("runValidateStage", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-validate-stage-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns ok true for a valid context", async () => {
    writeFileSync(join(baseDir, "tokens.json"), "{}");
    const hash = await hashFile(join(baseDir, "tokens.json"));
    const context = { ...baseContext, tokens: { file: "tokens.json", hash } };
    await writeAgentContext(baseDir, context);
    const stageResult = await runValidateStage(baseDir);
    expect(stageResult.ok).toBe(true);
  });

  it("returns a FIX_PACKET for an invalid agent-context.json", async () => {
    writeFileSync(join(baseDir, "agent-context.json"), '{"invalid": true}');
    const stageResult = await runValidateStage(baseDir);
    expect(stageResult.ok).toBe(false);
    expect(stageResult.packet?.errorCode.startsWith("AXM-V")).toBe(true);
  });
});
