import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";

const minimalContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:aa" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

describe("manifest reader/writer", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-manifest-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("reads a valid agent-context.json", async () => {
    writeFileSync(join(baseDir, "agent-context.json"), JSON.stringify(minimalContext));
    const ctx = await readAgentContext(baseDir);
    expect(ctx.project.name).toBe("demo");
  });

  it("round-trips through writer and reader", async () => {
    await writeAgentContext(baseDir, minimalContext);
    const ctx = await readAgentContext(baseDir);
    expect(ctx).toEqual(minimalContext);
  });
});
