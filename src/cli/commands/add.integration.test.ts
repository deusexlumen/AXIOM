import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");

function runIn(dir: string, command: string): void {
  const cmd = `node ${binPath} ${command}`;
  execSync(cmd, { cwd: dir, stdio: "ignore" });
}

function fileMap(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(dir, { recursive: true })) {
    const entryPath = typeof entry === "string" ? entry : entry.toString();
    const full = join(dir, entryPath);
    try {
      out[relative(dir, full).replace(/\\/g, "/")] = readFileSync(full, "utf-8");
    } catch {
      // directories only
    }
  }
  return out;
}

describe("axm add determinism", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-add-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("component generation is byte-identical across runs", { timeout: 120000 }, async () => {
    const a = join(baseDir, "a");
    const b = join(baseDir, "b");
    await init("demo", { cwd: a, skipInstall: true });
    await init("demo", { cwd: b, skipInstall: true });
    runIn(join(a, "demo"), "add component Button");
    runIn(join(b, "demo"), "add component Button");
    expect(fileMap(join(a, "demo", "src", "components"))).toEqual(fileMap(join(b, "demo", "src", "components")));
  });

  it("route generation is byte-identical across runs", { timeout: 120000 }, async () => {
    const a = join(baseDir, "c");
    const b = join(baseDir, "d");
    await init("demo", { cwd: a, skipInstall: true });
    await init("demo", { cwd: b, skipInstall: true });
    runIn(join(a, "demo"), "add component Home");
    runIn(join(b, "demo"), "add component Home");
    runIn(join(a, "demo"), "add route / --component Home");
    runIn(join(b, "demo"), "add route / --component Home");
    expect(fileMap(join(a, "demo", "src", "routes"))).toEqual(fileMap(join(b, "demo", "src", "routes")));
    expect(fileMap(join(a, "demo", "src", "generated"))).toEqual(fileMap(join(b, "demo", "src", "generated")));
  });

  it("store generation is byte-identical across runs", { timeout: 120000 }, async () => {
    const a = join(baseDir, "e");
    const b = join(baseDir, "f");
    await init("demo", { cwd: a, skipInstall: true });
    await init("demo", { cwd: b, skipInstall: true });
    runIn(join(a, "demo"), 'add store counter --shape "{\\"count\\":\\"number\\"}"');
    runIn(join(b, "demo"), 'add store counter --shape "{\\"count\\":\\"number\\"}"');
    expect(fileMap(join(a, "demo", "src", "state"))).toEqual(fileMap(join(b, "demo", "src", "state")));
  });

  it("tokens build is byte-identical across runs", { timeout: 120000 }, async () => {
    const a = join(baseDir, "g");
    const b = join(baseDir, "h");
    await init("demo", { cwd: a, skipInstall: true });
    await init("demo", { cwd: b, skipInstall: true });
    runIn(join(a, "demo"), "tokens build");
    runIn(join(b, "demo"), "tokens build");
    expect(readFileSync(join(a, "demo", "src", "generated", "theme.css"), "utf-8")).toBe(
      readFileSync(join(b, "demo", "src", "generated", "theme.css"), "utf-8")
    );
  });
});
