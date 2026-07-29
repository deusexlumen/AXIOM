import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { orderCommand } from "@/cli/commands/order.js";
import { readOrderFile } from "@/cli/commands/order-helpers.js";
import { readLeases, writeLeases } from "@/cli/leases/store.js";
import { parseLastLine, captureStdout } from "@/cli/commands/context.integration.helpers.js";
import fc from "fast-check";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

function runIn(dir: string, command: string): Record<string, unknown> {
  const raw = execSync(`node ${binPath} ${command}`, { cwd: dir, encoding: "utf-8" });
  return parseLastLine(raw).data as Record<string, unknown>;
}

function writeMinimalOrder(cwd: string): void {
  const fixture = JSON.parse(
    readFileSync(join(process.cwd(), "test", "fixtures", "orders", "minimal.json"), "utf-8")
  );
  mkdirSync(join(cwd, "orders", "open"), { recursive: true });
  writeFileSync(join(cwd, "orders", "open", "ord_minimal_001.json"), JSON.stringify(fixture, null, 2), "utf-8");
}

describe("axm lease integration", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-lease-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("heartbeat refreshes lease", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "heartbeat", "demo");
    await init("demo", { cwd: join(baseDir, "heartbeat"), skipInstall: true, out: noopStream() });
    writeMinimalOrder(dir);
    runIn(dir, "order claim ord_minimal_001 --agent agent-a");
    const before = await readLeases(dir);
    expect(before[0]?.agentId).toBe("agent-a");
    runIn(dir, "lease heartbeat --agent agent-a");
    const after = await readLeases(dir);
    expect(new Date(after[0]!.heartbeatAt).getTime()).toBeGreaterThan(
      new Date(before[0]!.heartbeatAt).getTime()
    );
  });

  it("reclaim releases expired lease and increments attempt", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "reclaim", "demo");
    await init("demo", { cwd: join(baseDir, "reclaim"), skipInstall: true, out: noopStream() });
    writeMinimalOrder(dir);
    runIn(dir, "order claim ord_minimal_001 --agent agent-a");
    const leases = await readLeases(dir);
    await writeLeases(dir, leases.map((l) => ({ ...l, heartbeatAt: "2020-01-01T00:00:00.000Z" })));
    const r = runIn(dir, "lease reclaim");
    expect((r.reclaimed as string[]).length).toBe(1);
    const order = await readOrderFile(dir, "ord_minimal_001");
    expect(order?.status).toBe("OPEN");
    expect(order?.attempts.current).toBe(1);
  });

  it("property: no double leases or scope violations", { timeout: 300000 }, async () => {
    const dir = join(baseDir, "stress", "demo");
    await init("demo", { cwd: join(baseDir, "stress"), skipInstall: true, out: noopStream() });
    for (let i = 0; i < 40; i++) {
      const order = JSON.parse(
        readFileSync(join(process.cwd(), "test", "fixtures", "orders", "minimal.json"), "utf-8")
      );
      order.orderId = `ord_stress_${String(i).padStart(3, "0")}`;
      order.scope.writeAllowed = [`src/components/Comp${i}.tsx`, `src/components/Comp${i}.spec.json`];
      order.dependsOn = [];
      mkdirSync(join(dir, "orders", "open"), { recursive: true });
      writeFileSync(join(dir, "orders", "open", `${order.orderId}.json`), JSON.stringify(order, null, 2), "utf-8");
    }
    const agents = Array.from({ length: 8 }, (_, i) => `agent-${i}`);
    const prev = process.cwd();
    process.chdir(dir);
    try {
      await fc.assert(
        fc.asyncProperty(fc.array(fc.integer({ min: 0, max: 39 }), { minLength: 200, maxLength: 200 }), async (indices) => {
          for (let i = 0; i < indices.length; i++) {
            const agent = agents[i % agents.length]!;
            const idx = indices[i]!;
            try {
              await captureStdout(() => orderCommand(["claim", `ord_stress_${String(idx).padStart(3, "0")}`, "--agent", agent]));
            } catch {
              // conflict is expected
            }
          }
          const leases = await readLeases(dir);
          const active = leases.filter((l) => Date.now() - new Date(l.heartbeatAt).getTime() <= l.ttlSeconds * 1000);
          const scopes = active.flatMap((l) => l.scope);
          expect(new Set(scopes).size).toBe(scopes.length);
          const orderIds = active.map((l) => l.orderId);
          expect(new Set(orderIds).size).toBe(orderIds.length);
          await writeLeases(dir, []);
        }),
        { numRuns: 5 }
      );
    } finally {
      process.chdir(prev);
    }
  });
});
