import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";

describe("agent-context.json self-hash", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-selfhash-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("passes integrity verification on a freshly scaffolded app", async () => {
    await init("demo", { cwd: baseDir, skipInstall: true, out: new Writable({ write() {} }) });
    const appDir = join(baseDir, "demo");
    const context = await readAgentContext(appDir);
    const violations = await verifyIntegrity(appDir, context);
    expect(violations).toHaveLength(0);
    expect(context.integrity.machineFiles["agent-context.json"]).toBeDefined();
    expect(context.integrity.machineFiles["agent-context.json"]).toMatch(/^sha256:/);
  });
});
