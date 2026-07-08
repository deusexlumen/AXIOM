import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("axm init integration", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-init-integ-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("scaffold installs and builds with pnpm", { timeout: 300000 }, async () => {
    await init("demo", { cwd: baseDir, out: noopStream() });
    const appDir = join(baseDir, "demo");
    execSync("pnpm build", { cwd: appDir, stdio: "ignore" });
    expect(existsSync(join(appDir, "dist", "index.html"))).toBe(true);
  });
});
