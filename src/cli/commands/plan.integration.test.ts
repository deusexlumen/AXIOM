import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { readOrderFiles, writeOrderFile } from "@/cli/commands/plan-fs.js";
import { writeVision, orderContents, runPlan, expectPlanError } from "@/cli/commands/plan.integration.helpers.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("axm plan integration", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-plan-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("produces byte-identical orders for identical visions", { timeout: 120000 }, async () => {
    const a = join(baseDir, "a", "demo");
    const b = join(baseDir, "b", "demo");
    await init("demo", { cwd: join(baseDir, "a"), skipInstall: true, out: noopStream() });
    await init("demo", { cwd: join(baseDir, "b"), skipInstall: true, out: noopStream() });
    writeVision(a, "valid");
    writeVision(b, "valid");

    const ra = await runPlan(a);
    const rb = await runPlan(b);
    expect(ra.orders).toBe(rb.orders);
    expect(ra.dagDepth).toBe(rb.dagDepth);
    expect(ra.criticalPath).toEqual(rb.criticalPath);
    expect(orderContents(a)).toBe(orderContents(b));
  });

  it("emits AXM-P002 on entity cycle", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "cycle", "demo");
    await init("demo", { cwd: join(baseDir, "cycle"), skipInstall: true, out: noopStream() });
    writeVision(dir, "cycle");
    await expectPlanError(dir, [], "AXM-P002");
  });

  it("emits AXM-P003 on budget ceiling", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "budget", "demo");
    await init("demo", { cwd: join(baseDir, "budget"), skipInstall: true, out: noopStream() });
    writeVision(dir, "budget");
    await expectPlanError(dir, [], "AXM-P003");
  });

  it("stops at post-plan veto gate and approves", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "veto", "demo");
    await init("demo", { cwd: join(baseDir, "veto"), skipInstall: true, out: noopStream() });
    writeVision(dir, "valid");

    const planResult = await runPlan(dir);
    expect(planResult.awaitingVeto).toBe(true);

    const contextPath = join(dir, "agent-context.json");
    const context = JSON.parse(readFileSync(contextPath, "utf-8")) as { visions: Array<{ status: string }> };
    expect(context.visions[0]?.status).toBe("PLANNED");

    const approveResult = await runPlan(dir, ["approve", "vis_test_001"]);
    expect(approveResult.status).toBe("APPROVED");
    const after = JSON.parse(readFileSync(contextPath, "utf-8")) as { visions: Array<{ status: string }> };
    expect(after.visions[0]?.status).toBe("APPROVED");
  });

  it("replan leaves DONE orders untouched", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "replan", "demo");
    await init("demo", { cwd: join(baseDir, "replan"), skipInstall: true, out: noopStream() });
    writeVision(dir, "valid");
    await runPlan(dir);

    const before = (await readOrderFiles(dir, "open")).find((o) => o.orderId === "ord_e2e");
    if (!before) throw new Error("ord_e2e missing");
    before.status = "DONE";
    await writeOrderFile(dir, before);

    const result = await runPlan(dir, ["replan", "--delta", '{"budgets":{"maxComponents":25}}']);
    expect(result.blockedIds).toEqual([]);

    const after = (await readOrderFiles(dir, "open")).find((o) => o.orderId === "ord_e2e");
    expect(after?.status).toBe("DONE");
  });
});
