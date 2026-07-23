import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { addComponent } from "@/cli/commands/add.js";
import { healCommand } from "@/cli/commands/heal.js";
import { CliError } from "@/cli/errors.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { noopStream } from "@/cli/commands/validate.integration.context.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

beforeAll(() => {
  execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
}, 120000);

function captureStream(): { stream: NodeJS.WritableStream; lines: string[] } {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString().trim());
      callback();
    },
  });
  return { stream, lines };
}

async function makeApp(): Promise<{ base: string; dir: string }> {
  const base = mkdtempSync(join(tmpdir(), "axiom-heal-"));
  const name = `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await init(name, { cwd: base, skipInstall: true, out: noopStream() });
  const dir = join(base, name);
  await installAppDeps(dir);
  writeFileSync(
    join(dir, "playwright.config.ts"),
    'import { defineConfig } from "@playwright/test";\nexport default defineConfig({ testDir: "e2e", projects: [] });\n'
  );
  return { base, dir };
}

async function waitForFirstPacket(dir: string): Promise<FixPacket> {
  const packetDir = join(dir, "pipeline", "fix-packets");
  for (let i = 0; i < 200; i++) {
    try {
      const files = readdirSync(packetDir);
      if (files.length > 0) {
        const content = readFileSync(join(packetDir, files[0]!), "utf-8").trim();
        return JSON.parse(content.split("\n")[0]!) as FixPacket;
      }
    } catch {
      // wait
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("No FIX_PACKET emitted");
}

function lastLine(lines: string[]): unknown {
  return JSON.parse(lines[lines.length - 1]!);
}

describe("axm heal --auto", () => {
  let base: string;
  let dir: string;

  beforeAll(async () => {
    const app = await makeApp();
    base = app.base;
    dir = app.dir;
  }, 300000);

  afterAll(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

  beforeEach(() => {
    rmSync(join(dir, "pipeline", "fix-packets"), { recursive: true, force: true });
    rmSync(join(dir, "pipeline", "ack"), { recursive: true, force: true });
    rmSync(join(dir, "pipeline", "reports"), { recursive: true, force: true });
  });

  it("succeeds at attempt 1 on a green app", { timeout: 180000 }, async () => {
    await addComponent("Good", { cwd: dir, out: noopStream() });
    const { stream, lines } = captureStream();
    await healCommand({ cwd: dir, maxRetries: 2, out: stream });
    expect(lastLine(lines)).toEqual({ ok: true, healedAtAttempt: 1 });
  });

  it("heals after ack and fix", { timeout: 180000 }, async () => {
    await addComponent("Fixable", { cwd: dir, out: noopStream() });
    writeFileSync(
      join(dir, "src/components/Fixable.tsx"),
      "export function Fixable() {\n  const unused = 1;\n  return <div data-axm-id=\"Fixable\" />;\n}\n"
    );
    const { stream, lines } = captureStream();
    const healPromise = healCommand({ cwd: dir, maxRetries: 2, ackTimeoutMs: 20000, out: stream });
    const packet = await waitForFirstPacket(dir);
    writeFileSync(join(dir, "src/components/Fixable.tsx"), 'export function Fixable() { return <div data-axm-id="Fixable" />; }\n');
    mkdirSync(join(dir, "pipeline", "ack"), { recursive: true });
    writeFileSync(join(dir, "pipeline", "ack", packet.packetId), "ack");
    await healPromise;
    expect(lastLine(lines)).toEqual({ ok: true, healedAtAttempt: 2 });
  });

  it("escalates unfixable error", { timeout: 180000 }, async () => {
    await addComponent("Bad", { cwd: dir, out: noopStream() });
    writeFileSync(
      join(dir, "src/components/Bad.tsx"),
      "export function Bad() {\n  const unused = 1;\n  return <div data-axm-id=\"Bad\" />;\n}\n"
    );
    const { stream, lines } = captureStream();
    const healPromise = healCommand({ cwd: dir, maxRetries: 2, ackTimeoutMs: 20000, out: stream });
    const packet = await waitForFirstPacket(dir);
    writeFileSync(
      join(dir, "src/components/Bad.tsx"),
      "export function Bad() {\n  const unused = 1;\n  return <div data-axm-id=\"Bad\" />;\n}\n\n"
    );
    mkdirSync(join(dir, "pipeline", "ack"), { recursive: true });
    writeFileSync(join(dir, "pipeline", "ack", packet.packetId), "ack");
    let error: unknown;
    try {
      await healPromise;
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(CliError);
    expect((error as CliError).exitCode).toBe(50);
    const first = JSON.parse(lines[0]!);
    expect(first.ok).toBe(false);
    expect(first.packet.errorCode).toBe("AXM-L001");
    const reports = readdirSync(join(dir, "pipeline", "reports"));
    expect(reports.some((f) => f.startsWith("escalation_"))).toBe(true);
  });
});
