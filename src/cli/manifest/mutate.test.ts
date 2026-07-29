import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const baseCtx: AgentContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

describe("manifest mutate", () => {
  it("recomputes agent-context.json hash on write", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-mutate-"));
    writeFileSync(join(dir, "agent-context.json"), JSON.stringify(baseCtx));
    const ctx = await readContext(dir);
    ctx.components.push({
      name: "X",
      file: "src/components/X.tsx",
      spec: "src/components/X.spec.json",
      test: "src/components/X.test.tsx",
      exports: ["X"],
      dependsOn: [],
      usedBy: [],
      loc: 1,
      bytes: 1,
      status: "STALE",
      specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    });
    await writeContext(dir, ctx);
    const written = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
    expect(written.integrity.machineFiles["agent-context.json"]).toMatch(/^sha256:/);
    rmSync(dir, { recursive: true, force: true });
  });
});
