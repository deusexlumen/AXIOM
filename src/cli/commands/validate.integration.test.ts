import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { noopStream, writeMinimalContext } from "@/cli/commands/validate.integration.context.js";
import { runValidate, parsePacket } from "@/cli/commands/validate.integration.run.js";
import { installComponent } from "@/cli/commands/validate.integration.install.js";
import { invariantFixtures } from "@/cli/commands/validate.integration.invariant-fixtures.js";
import { motionFixtures } from "@/cli/commands/validate.integration.motion-fixtures.js";
import { a11yFixtures } from "@/cli/commands/validate.integration.a11y-fixtures.js";

let baseDir: string;
let appDir: string;

beforeAll(async () => {
  baseDir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
  await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
  appDir = join(baseDir, "demo");
  await installAppDeps(appDir);
}, 300000);

afterAll(() => rmSync(baseDir, { recursive: true, force: true }));

describe("axm validate invariant fixtures", () => {
  it("reports AXM-V002 for a file exceeding byte budget", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    writeMinimalContext(dir, { lockedFiles: {}, machineFiles: {} });
    const big = "x".repeat(5000);
    installComponent(dir, "Big", "src/components/Big.tsx", `export function Big() { return <div data-axm-id="Big">${big}</div>; }\n`);
    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(10);
    expect(parsePacket(stdout).errorCode).toBe("AXM-V002");
    rmSync(dir, { recursive: true, force: true });
  }, 60000);

  it("reports AXM-V010 for a component placed in a LOCKED zone", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    writeMinimalContext(dir, { lockedFiles: { "src/core/router.ts": "sha256:aaa" }, machineFiles: {} });
    mkdirSync(join(dir, "src", "core"), { recursive: true });
    installComponent(dir, "Bad", "src/core/router.ts", "export function Bad() { return null; }\n");
    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(60);
    expect(parsePacket(stdout).errorCode).toBe("AXM-V010");
    rmSync(dir, { recursive: true, force: true });
  }, 60000);

  const cases = [...invariantFixtures, ...motionFixtures, ...a11yFixtures];

  it.each(cases)("reports $code for $inv", async ({ file, content, code, helpers }) => {
    for (const [helperFile, helperContent] of helpers ?? []) {
      writeFileSync(join(appDir, helperFile), helperContent);
    }
    installComponent(appDir, file.slice(14, -4), file, content);
    const { exitCode, stdout } = await runValidate(appDir);
    expect(exitCode).toBe(10);
    expect(parsePacket(stdout).errorCode).toBe(code);
  }, 60000);
});
