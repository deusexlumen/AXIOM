import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { readOrderFile } from "@/cli/commands/order-helpers.js";
import { parseLastLine } from "@/cli/commands/context.integration.helpers.js";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

function runIn(dir: string, command: string): Record<string, unknown> {
  try {
    const raw = execSync(`node ${binPath} ${command}`, { cwd: dir, encoding: "utf-8" });
    return parseLastLine(raw).data as Record<string, unknown>;
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout ?? "";
    if (stdout) return parseLastLine(stdout).data as Record<string, unknown>;
    throw error;
  }
}

function writeMinimalOrder(cwd: string): void {
  const fixture = JSON.parse(
    readFileSync(join(process.cwd(), "test", "fixtures", "orders", "minimal.json"), "utf-8")
  );
  mkdirSync(join(cwd, "orders", "open"), { recursive: true });
  writeFileSync(join(cwd, "orders", "open", "ord_minimal_001.json"), JSON.stringify(fixture, null, 2), "utf-8");
}

describe("axm order integration", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-order-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("claim is deterministic across fresh repos", { timeout: 120000 }, async () => {
    const a = join(baseDir, "a", "demo");
    const b = join(baseDir, "b", "demo");
    await init("demo", { cwd: join(baseDir, "a"), skipInstall: true, out: noopStream() });
    await init("demo", { cwd: join(baseDir, "b"), skipInstall: true, out: noopStream() });
    writeMinimalOrder(a);
    writeMinimalOrder(b);
    const ra = runIn(a, "order claim ord_minimal_001 --agent agent-a");
    const rb = runIn(b, "order claim ord_minimal_001 --agent agent-a");
    expect(ra.status).toBe("CLAIMED");
    expect(rb.status).toBe("CLAIMED");
    const oa = await readOrderFile(a, "ord_minimal_001");
    const ob = await readOrderFile(b, "ord_minimal_001");
    expect(oa?.status).toBe(ob?.status);
    expect(oa?.claimedBy).toBe(ob?.claimedBy);
  });

  it("overlapping scope claim returns AXM-M001", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "conflict", "demo");
    await init("demo", { cwd: join(baseDir, "conflict"), skipInstall: true, out: noopStream() });
    writeMinimalOrder(dir);
    const fixture = JSON.parse(
      readFileSync(join(process.cwd(), "test", "fixtures", "orders", "minimal.json"), "utf-8")
    );
    fixture.orderId = "ord_overlap_001";
    mkdirSync(join(dir, "orders", "open"), { recursive: true });
    writeFileSync(join(dir, "orders", "open", "ord_overlap_001.json"), JSON.stringify(fixture, null, 2), "utf-8");
    runIn(dir, "order claim ord_minimal_001 --agent agent-a");
    const r = runIn(dir, "order claim ord_overlap_001 --agent agent-b");
    expect(r.errorCode).toBe("AXM-M001");
  });

  it("scope violation returns AXM-M003", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "scope", "demo");
    await init("demo", { cwd: join(baseDir, "scope"), skipInstall: true, out: noopStream() });
    writeMinimalOrder(dir);
    runIn(dir, "order claim ord_minimal_001 --agent agent-a");
    const r = runIn(dir, "add component NotButton --agent agent-a");
    expect(r.errorCode).toBe("AXM-M003");
  });

  it("release returns order to OPEN", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "release", "demo");
    await init("demo", { cwd: join(baseDir, "release"), skipInstall: true, out: noopStream() });
    writeMinimalOrder(dir);
    runIn(dir, "order claim ord_minimal_001 --agent agent-a");
    const r = runIn(dir, "order release ord_minimal_001");
    expect(r.status).toBe("OPEN");
    const order = await readOrderFile(dir, "ord_minimal_001");
    expect(order?.status).toBe("OPEN");
    expect(order?.claimedBy).toBeNull();
  });
});
