import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { parseLastLine } from "@/cli/commands/context.integration.helpers.js";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

function runIn(dir: string, command: string): Record<string, unknown> {
  const raw = execSync(`node ${binPath} ${command}`, { cwd: dir, encoding: "utf-8" });
  return parseLastLine(raw).data as Record<string, unknown>;
}

function writeOrder(cwd: string, orderId: string, dependsOn: string[], status: string): void {
  const fixture = JSON.parse(
    readFileSync(join(process.cwd(), "test", "fixtures", "orders", "minimal.json"), "utf-8")
  );
  fixture.orderId = orderId;
  fixture.dependsOn = dependsOn;
  fixture.status = status;
  fixture.scope.writeAllowed = [`src/components/${orderId}.tsx`];
  mkdirSync(join(cwd, "orders", "open"), { recursive: true });
  writeFileSync(join(cwd, "orders", "open", `${orderId}.json`), JSON.stringify(fixture, null, 2), "utf-8");
}

describe("axm conduct integration", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-conduct-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("recommends ready orders by DAG depth", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "conduct", "demo");
    await init("demo", { cwd: join(baseDir, "conduct"), skipInstall: true, out: noopStream() });
    writeOrder(dir, "ord_a", [], "DONE");
    writeOrder(dir, "ord_b", ["ord_a"], "DONE");
    writeOrder(dir, "ord_c", ["ord_b"], "OPEN");
    writeOrder(dir, "ord_d", ["ord_a"], "OPEN");
    const r = runIn(dir, "conduct --agents 2");
    const recs = r.recommendations as Array<{ orderId: string; priority: number }>;
    expect(recs[0]?.orderId).toBe("ord_c");
    expect(recs[0]?.priority).toBe(2);
    expect(recs[1]?.orderId).toBe("ord_d");
    expect(recs[1]?.priority).toBe(1);
    expect(recs.length).toBe(2);
  });
});
