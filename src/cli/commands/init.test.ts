import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function snapshotDir(dir: string): Map<string, string> {
  const entries = readdirSync(dir, { recursive: true, encoding: "utf-8" })
    .filter((f) => f !== "")
    .filter(
      (f) =>
        !f.startsWith("node_modules/") && !f.includes("/dist/") && f !== "pnpm-lock.yaml",
    )
    .map((f) => join(dir, f))
    .filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    })
    .sort();

  const map = new Map<string, string>();
  for (const entry of entries) {
    map.set(relative(dir, entry), hashFile(entry));
  }
  return map;
}

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("axm init", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-init-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("creates expected files", { timeout: 30000 }, async () => {
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    const files = readdirSync(appDir, { recursive: true, encoding: "utf-8" })
      .filter((f) => f !== "")
      .sort();
    expect(files).toContain("package.json");
    expect(files).toContain("tsconfig.json");
    expect(files).toContain("vite.config.ts");
    expect(files).toContain(join("src", "App.tsx"));

    const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf-8"));
    expect(pkg.name).toBe("demo");
    expect(pkg.packageManager).toBe("pnpm@9.15.0");
    expect(pkg.devDependencies).toHaveProperty("@axiom/cli");

    const workflowPath = join(appDir, ".github", "workflows", "axiom.yml");
    expect(statSync(workflowPath).isFile()).toBe(true);
    const workflow = readFileSync(workflowPath, "utf-8");
    expect(workflow).toContain("actions/checkout@v4");
    expect(workflow).toContain("pnpm/action-setup@v4");
    expect(workflow).toContain("actions/setup-node@v4");
    expect(existsSync(join(appDir, "packages", "axiom-cli", "package.json"))).toBe(true);

    expect(workflow).toContain("pnpm exec playwright install --with-deps");
    expect(workflow).toContain("pnpm axm audit");
    expect(workflow).toContain("pnpm axm validate");
    expect(workflow).toContain("pnpm axm pipeline run");
    expect(workflow).toContain("Upload FIX_PACKETs on failure");
  });

  it("is deterministic across runs", { timeout: 30000 }, async () => {
    await init("a", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const first = snapshotDir(join(baseDir, "a"));

    rmSync(join(baseDir, "a"), { recursive: true, force: true });

    await init("a", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const second = snapshotDir(join(baseDir, "a"));

    expect(second.size).toBe(first.size);
    for (const [path, hash] of first) {
      expect(second.get(path)).toBe(hash);
    }
  });
});
