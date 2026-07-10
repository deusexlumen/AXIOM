import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";

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
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    installAppDeps(appDir);
    execSync("pnpm build", { cwd: appDir, stdio: "ignore" });
    expect(existsSync(join(appDir, "dist", "index.html"))).toBe(true);
  });
});
