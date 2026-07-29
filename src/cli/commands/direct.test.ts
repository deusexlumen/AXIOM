import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Writable } from "node:stream";
import { directGenerate, directChoose, directAmend } from "@/cli/commands/direct.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

function minimalContext(): Record<string, unknown> {
  return {
    axiomVersion: "1.0.0",
    project: { name: "test", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: "sha256:initial" },
    integrity: { lockedFiles: {}, machineFiles: {} },
    pipeline: { lastRun: null },
  };
}

describe("direct commands", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-direct-test-"));
    writeFileSync(resolve(baseDir, "agent-context.json"), JSON.stringify(minimalContext()), "utf-8");
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("generate creates three direction candidates and style-tile orders", async () => {
    await directGenerate({ cwd: baseDir, out: noopStream() });
    expect(existsSync(resolve(baseDir, "DIRECTION_A.axm.json"))).toBe(true);
    expect(existsSync(resolve(baseDir, "DIRECTION_B.axm.json"))).toBe(true);
    expect(existsSync(resolve(baseDir, "DIRECTION_C.axm.json"))).toBe(true);
    expect(existsSync(resolve(baseDir, "orders", "open", "style-tile-dir_a.json"))).toBe(true);
    expect(existsSync(resolve(baseDir, "orders", "open", "style-tile-dir_b.json"))).toBe(true);
    expect(existsSync(resolve(baseDir, "orders", "open", "style-tile-dir_c.json"))).toBe(true);
  });

  it("choose copies a candidate to DIRECTION.axm.json and freezes it", async () => {
    await directGenerate({ cwd: baseDir, out: noopStream() });
    await directChoose({ cwd: baseDir, directionId: "dir_B", out: noopStream() });

    const chosen = JSON.parse(readFileSync(resolve(baseDir, "DIRECTION.axm.json"), "utf-8"));
    expect(chosen.directionId).toBe("dir_B");

    const context = JSON.parse(readFileSync(resolve(baseDir, "agent-context.json"), "utf-8"));
    expect(context.direction.file).toBe("DIRECTION.axm.json");
    expect(context.direction.hash).toMatch(/^sha256:/);
    expect(context.direction.frozenAt).toBeDefined();
  });

  it("amend updates the frozen hash", async () => {
    await directGenerate({ cwd: baseDir, out: noopStream() });
    await directChoose({ cwd: baseDir, directionId: "dir_A", out: noopStream() });

    const before = JSON.parse(readFileSync(resolve(baseDir, "agent-context.json"), "utf-8"));
    const originalHash = before.direction.hash;

    const direction = JSON.parse(readFileSync(resolve(baseDir, "DIRECTION.axm.json"), "utf-8"));
    direction.thesis = "Updated thesis";
    writeFileSync(resolve(baseDir, "DIRECTION.axm.json"), JSON.stringify(direction, null, 2), "utf-8");

    await directAmend({ cwd: baseDir, reason: "Client feedback", out: noopStream() });

    const after = JSON.parse(readFileSync(resolve(baseDir, "agent-context.json"), "utf-8"));
    expect(after.direction.hash).not.toBe(originalHash);
  });

  it("choose throws on unknown candidate", async () => {
    await directGenerate({ cwd: baseDir, out: noopStream() });
    await expect(directChoose({ cwd: baseDir, directionId: "dir_Z", out: noopStream() })).rejects.toThrow();
  });
});
