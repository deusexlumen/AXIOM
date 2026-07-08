import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validate } from "@/cli/commands/validate.js";
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

describe("validate command", () => {
  let baseDir: string;
  let exitCode: number | undefined;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-validate-test-"));
    exitCode = undefined;
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("passes for valid context with matching hashes", async () => {
    writeFileSync(join(baseDir, "tokens.json"), "{}");
    const h = await hashFile(join(baseDir, "tokens.json"));
    const context = { ...baseContext, tokens: { file: "tokens.json", hash: h } };
    await writeAgentContext(baseDir, context);
    await expect(validate(baseDir)).resolves.toBeUndefined();
  });

  it("throws for invalid agent-context.json", async () => {
    writeFileSync(join(baseDir, "agent-context.json"), "{\"invalid\":true}");
    await expect(validate(baseDir)).rejects.toThrow();
  });
});
