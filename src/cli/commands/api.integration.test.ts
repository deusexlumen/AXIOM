import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";

function installZod(cwd: string): void {
  const target = join(cwd, "node_modules");
  mkdirSync(target, { recursive: true });
  cpSync(join(process.cwd(), "node_modules", "zod"), join(target, "zod"), { recursive: true, force: true });
}

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");
const fixturePath: string = join(process.cwd(), "test", "fixtures", "contracts", "tasks.contract.ts");

function runIn(dir: string, command: string): void {
  const cmd = `node ${binPath} ${command}`;
  execSync(cmd, { cwd: dir, stdio: "ignore" });
}

describe("axm api integration", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-api-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("adds a contract and generates deterministic artifacts", { timeout: 300000 }, async () => {
    const a = join(baseDir, "a");
    const b = join(baseDir, "b");
    await init("demo", { cwd: a, skipInstall: true });
    await init("demo", { cwd: b, skipInstall: true });
    installZod(join(a, "demo"));
    installZod(join(b, "demo"));
    cpSync(fixturePath, join(a, "demo", "tasks.contract.ts"));
    cpSync(fixturePath, join(b, "demo", "tasks.contract.ts"));
    runIn(join(a, "demo"), "api add tasks --contract ./tasks.contract.ts");
    runIn(join(b, "demo"), "api add tasks --contract ./tasks.contract.ts");
    expect(existsSync(join(a, "demo", "api", "contracts", "tasks.contract.ts"))).toBe(true);
    expect(existsSync(join(a, "demo", "api", "handlers", "tasks.list.ts"))).toBe(true);
    expect(existsSync(join(a, "demo", "api", "handlers", "tasks.create.ts"))).toBe(true);
    expect(readFileSync(join(a, "demo", "api", "generated", "handler-types.ts"), "utf-8")).toBe(
      readFileSync(join(b, "demo", "api", "generated", "handler-types.ts"), "utf-8")
    );
    expect(readFileSync(join(a, "demo", "src", "generated", "api-client.ts"), "utf-8")).toBe(
      readFileSync(join(b, "demo", "src", "generated", "api-client.ts"), "utf-8")
    );
    expect(readFileSync(join(a, "demo", "api", "generated", "openapi.json"), "utf-8")).toBe(
      readFileSync(join(b, "demo", "api", "generated", "openapi.json"), "utf-8")
    );
  });

  it("build regenerates artifacts", { timeout: 300000 }, async () => {
    const dir = join(baseDir, "c");
    await init("demo", { cwd: dir, skipInstall: true });
    installZod(join(dir, "demo"));
    cpSync(fixturePath, join(dir, "demo", "tasks.contract.ts"));
    runIn(join(dir, "demo"), "api add tasks --contract ./tasks.contract.ts");
    const before = readFileSync(join(dir, "demo", "api", "generated", "openapi.json"), "utf-8");
    runIn(join(dir, "demo"), "api build");
    const after = readFileSync(join(dir, "demo", "api", "generated", "openapi.json"), "utf-8");
    expect(after).toBe(before);
  });
});
