import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";

describe("axm init integration", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-init-integ-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  }, 60000);

  it("scaffold builds with pnpm", { timeout: 180000 }, async () => {
    await init("demo", { cwd: baseDir });
    const appDir = join(baseDir, "demo");
    execSync("pnpm install", { cwd: appDir, stdio: "ignore" });
    execSync("pnpm build", { cwd: appDir, stdio: "ignore" });
    expect(true).toBe(true);
  });
});
