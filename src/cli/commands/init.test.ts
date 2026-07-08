import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";

describe("axm init", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-init-test-"));
    process.chdir(baseDir);
  });

  afterEach(() => {
    process.chdir(tmpdir());
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("creates expected files", async () => {
    await init("demo");
    const files = readdirSync(join(baseDir, "demo"), { recursive: true, encoding: "utf-8" })
      .filter((f) => f !== "")
      .sort();
    expect(files).toContain("package.json");
    expect(files).toContain("tsconfig.json");
    expect(files).toContain("vite.config.ts");
    expect(files).toContain(join("src", "App.tsx"));
  });

  it("is deterministic across runs", async () => {
    await init("a");
    const first = readFileSync(join(baseDir, "a", "package.json"), "utf-8");
    rmSync(join(baseDir, "a"), { recursive: true, force: true });
    await init("a");
    const second = readFileSync(join(baseDir, "a", "package.json"), "utf-8");
    expect(second).toBe(first);
  });
});
