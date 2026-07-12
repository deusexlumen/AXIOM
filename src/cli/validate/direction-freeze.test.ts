import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { checkDirectionFreeze } from "@/cli/validate/checks.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { hashString } from "@/cli/manifest/hash.js";

function contextWithDirection(hash: string): AgentContext {
  return {
    axiomVersion: "1.0.0",
    project: { name: "test", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: "sha256:initial" },
    direction: { file: "DIRECTION.axm.json", hash, frozenAt: new Date().toISOString() },
    integrity: { lockedFiles: {}, machineFiles: {} },
    pipeline: { lastRun: null },
  };
}

describe("checkDirectionFreeze", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-direction-freeze-test-"));
    writeFileSync(resolve(baseDir, "DIRECTION.axm.json"), "{}", "utf-8");
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns null when hash matches", async () => {
    const hash = hashString("{}");
    const packet = await checkDirectionFreeze(baseDir, contextWithDirection(hash));
    expect(packet).toBeNull();
  });

  it("returns AXM-R002 when direction was mutated", async () => {
    const hash = hashString("stale");
    const packet = await checkDirectionFreeze(baseDir, contextWithDirection(hash));
    expect(packet).not.toBeNull();
    expect(packet?.errorCode).toBe("AXM-R002");
    expect(packet?.invariantsAffected).toContain("I-20");
  });
});
