import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeIntegrity, verifyIntegrity } from "@/cli/manifest/integrity.js";
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

describe("integrity", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-integrity-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("computes hashes for listed files", async () => {
    writeFileSync(join(baseDir, "a.txt"), "hello");
    const { locked } = await computeIntegrity(baseDir, ["a.txt"], []);
    expect(locked["a.txt"]).toBe(await hashFile(join(baseDir, "a.txt")));
  });

  it("reports no violations when hashes match", async () => {
    writeFileSync(join(baseDir, "b.txt"), "world");
    const h = await hashFile(join(baseDir, "b.txt"));
    const context = { ...baseContext, integrity: { lockedFiles: { "b.txt": h }, machineFiles: {} } };
    const violations = await verifyIntegrity(baseDir, context);
    expect(violations).toHaveLength(0);
  });

  it("reports violations when hashes mismatch", async () => {
    writeFileSync(join(baseDir, "c.txt"), "changed");
    const context = { ...baseContext, integrity: { lockedFiles: { "c.txt": "sha256:old" }, machineFiles: {} } };
    const violations = await verifyIntegrity(baseDir, context);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.file).toBe("c.txt");
  });
});
