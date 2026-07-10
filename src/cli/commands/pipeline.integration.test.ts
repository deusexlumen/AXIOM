import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";
import { addComponent } from "@/cli/commands/add.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { installComponent, runPipeline, parseReport, readPacket, noopStream } from "@/cli/commands/validate.integration.helpers.js";

beforeAll(() => {
  execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
}, 120000);

async function scaffold(install = false): Promise<{ base: string; dir: string }> {
  const base = mkdtempSync(join(tmpdir(), "axiom-pipe-"));
  const name = `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await init(name, { cwd: base, skipInstall: true, out: noopStream() });
  const dir = join(base, name);
  if (install) {
    installAppDeps(dir);
  }
  return { base, dir };
}

function assertRedPacket(stdout: string, dir: string, stage: string, code: string): void {
  const data = parseReport(stdout);
  expect(data.ok).toBe(false);
  expect(data.report.result).toBe("RED");
  expect(data.report.failedStage).toBe(stage);
  const packet = readPacket(dir, data.report.packetFile!);
  expect(packet.errorCode).toBe(code);
}

describe("axm pipeline run error fixtures", () => {
  it("AXM-V001 for component exceeding LOC budget", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    const lines = Array.from({ length: 130 }, (_, i) => `const a${i} = ${i};`).join("\n");
    installComponent(dir, "Bad", "src/components/Bad.tsx", `${lines}\nexport function Bad() { return <div data-axm-id="Bad" />; }\n`);
    const { exitCode, stdout } = await runPipeline(dir);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "validate", "AXM-V001");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });

  it("AXM-V002 for component exceeding byte budget", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    const big = "x".repeat(5000);
    installComponent(dir, "Bad", "src/components/Bad.tsx", `export function Bad() { return <div data-axm-id="Bad">${big}</div>; }\n`);
    const { exitCode, stdout } = await runPipeline(dir);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "validate", "AXM-V002");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });

  it("AXM-V004 for default export", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    installComponent(dir, "Bad", "src/components/Bad.tsx", "export default function Bad() { return <div />; }\n");
    const { exitCode, stdout } = await runPipeline(dir);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "validate", "AXM-V004");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });

  it("AXM-V006 for relative import", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    installComponent(dir, "Bad", "src/components/Bad.tsx", 'import { Helper } from "./BadHelper";\nexport function Bad() { return <Helper data-axm-id="Bad" />; }\n');
    writeFileSync(join(dir, "src/components/BadHelper.tsx"), "export function Helper() { return <div />; }\n");
    const { exitCode, stdout } = await runPipeline(dir);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "validate", "AXM-V006");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });

  it("AXM-V008 for raw color value", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    installComponent(dir, "Bad", "src/components/Bad.tsx", 'export function Bad() { return <div data-axm-id="Bad" style={{ color: "#ff0000" }} />; }\n');
    const { exitCode, stdout } = await runPipeline(dir);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "validate", "AXM-V008");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });

  it("AXM-V009 for @ts-ignore", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    installComponent(dir, "Bad", "src/components/Bad.tsx", "export function Bad() {\n  // @ts-ignore\n  return <div data-axm-id=\"Bad\" />;\n}\n");
    const { exitCode, stdout } = await runPipeline(dir);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "validate", "AXM-V009");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });

  describe("installed-app fixtures", () => {
    let installedBase: string;
    let installedDir: string;

    beforeAll(async () => {
      const { base, dir } = await scaffold(true);
      installedBase = base;
      installedDir = dir;
    }, 240000);

    afterAll(() => rmSync(installedBase, { recursive: true, force: true, maxRetries: 3 }));

    it("AXM-T001 for TypeScript type error", { timeout: 180000 }, async () => {
      await addComponent("TypecheckBad", { cwd: installedDir, out: noopStream() });
      writeFileSync(join(installedDir, "src/components/TypecheckBad.tsx"), "export function TypecheckBad() {\n  const x: string = 42;\n  return <div data-axm-id=\"TypecheckBad\">{x}</div>;\n}\n");
      const { exitCode, stdout } = await runPipeline(installedDir, ["--stage", "typecheck"]);
      expect(exitCode).toBe(0);
      assertRedPacket(stdout, installedDir, "typecheck", "AXM-T001");
    });

    it("AXM-L001 for ESLint unused variable", { timeout: 180000 }, async () => {
      await addComponent("LintBad", { cwd: installedDir, out: noopStream() });
      writeFileSync(join(installedDir, "src/components/LintBad.tsx"), "export function LintBad() {\n  const unused = 1;\n  return <div data-axm-id=\"LintBad\" />;\n}\n");
      const { exitCode, stdout } = await runPipeline(installedDir, ["--stage", "lint"]);
      expect(exitCode).toBe(0);
      assertRedPacket(stdout, installedDir, "lint", "AXM-L001");
    });

    it("AXM-U001 for failing unit test", { timeout: 180000 }, async () => {
      await addComponent("UnitBad", { cwd: installedDir, out: noopStream() });
      writeFileSync(join(installedDir, "src/components/UnitBad.test.tsx"), 'import { describe, it, expect } from "vitest";\ndescribe("UnitBad", () => { it("fails", () => { expect(false).toBe(true); }); });\n');
      const { exitCode, stdout } = await runPipeline(installedDir, ["--stage", "unit"]);
      expect(exitCode).toBe(0);
      assertRedPacket(stdout, installedDir, "unit", "AXM-U001");
    });
  });

  it("AXM-E001 for failing E2E test", { timeout: 120000 }, async () => {
    const { base, dir } = await scaffold();
    writeFileSync(join(dir, "e2e/bad.spec.ts"), 'import { test, expect } from "@playwright/test";\ntest("fails", () => { expect(false).toBe(true); });\n');
    const { exitCode, stdout } = await runPipeline(dir, ["--stage", "e2e"]);
    expect(exitCode).toBe(0);
    assertRedPacket(stdout, dir, "e2e", "AXM-E001");
    rmSync(base, { recursive: true, force: true, maxRetries: 3 });
  });
});
