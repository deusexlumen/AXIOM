import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
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
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    installAppDeps(appDir);
    execSync("pnpm build", { cwd: appDir, stdio: "ignore" });
    expect(existsSync(join(appDir, ".next"))).toBe(true);
  });

  it("detects I-18 raw motion engine import via lint", { timeout: 120000 }, async () => {
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    installAppDeps(appDir);

    writeFileSync(
      join(appDir, "src", "components", "RawMotion.tsx"),
      "import gsap from \"gsap\";\nexport function RawMotion() { gsap.to({}, {}); return null; }\n",
      "utf-8",
    );

    let lintOutput = "";
    try {
      execSync("pnpm lint", { cwd: appDir, stdio: "pipe", encoding: "utf-8" });
    } catch (error) {
      lintOutput = String((error as { stdout?: string; stderr?: string }).stdout ?? "");
      lintOutput += String((error as { stdout?: string; stderr?: string }).stderr ?? "");
    }

    expect(lintOutput).toContain("no-raw-motion-engine");
    expect(lintOutput).toContain("I-18");
    expect(lintOutput).toContain("RawMotion.tsx");
  });
});
