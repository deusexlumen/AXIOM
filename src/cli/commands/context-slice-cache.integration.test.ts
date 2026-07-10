import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";
import { addComponent } from "@/cli/commands/add.js";
import { contextSliceCommand } from "@/cli/commands/context.js";
import {
  noopStream,
  captureStream,
  linkComponentChain,
} from "@/cli/commands/context.integration.helpers.js";
import { parseResult } from "@/cli/commands/integration-helpers.js";

function percentile(sorted: number[], p: number): number {
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}

describe("axm context slice cache", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-slice-cache-integ-"));
    execSync("pnpm build", { cwd: process.cwd(), stdio: "ignore" });
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 300000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("returns cached:true on the second identical slice call", async () => {
    const dir = join(baseDir, "cache-hit");
    await init("cache-hit", { cwd: baseDir, skipInstall: true, out: noopStream() });
    await addComponent("Alpha", { cwd: dir, out: noopStream() });

    const target = "src/components/Alpha.tsx";
    const first = captureStream();
    await contextSliceCommand({ target, cwd: dir, out: first.stream });
    expect(parseResult(first.output()).cached).toBe(false);

    const second = captureStream();
    await contextSliceCommand({ target, cwd: dir, out: second.stream });
    expect(parseResult(second.output()).cached).toBe(true);
  }, 120000);

  it("keeps p95 slice latency under 200 ms for a 30-component repo", async () => {
    const dir = join(baseDir, "scale");
    await init("scale", { cwd: baseDir, skipInstall: true, out: noopStream() });
    for (let i = 0; i < 30; i++) {
      await addComponent(`Component_${i}`, { cwd: dir, out: noopStream() });
    }
    linkComponentChain(dir, 30);

    const latencies: number[] = [];
    const targets: string[] = [];
    for (let i = 0; i < 30; i++) {
      const target = `src/components/Component_${i}.tsx`;
      targets.push(target);
      const capture = captureStream();
      await contextSliceCommand({ target, cwd: dir, out: capture.stream });
      const data = parseResult(capture.output());
      expect(data.ok).toBe(true);
      if (typeof data.latencyMs === "number") latencies.push(data.latencyMs);
    }
    latencies.sort((a, b) => a - b);
    expect(percentile(latencies, 95)).toBeLessThan(200);

    let cacheHits = 0;
    for (const target of targets) {
      const capture = captureStream();
      await contextSliceCommand({ target, cwd: dir, out: capture.stream });
      const data = parseResult(capture.output());
      expect(data.ok).toBe(true);
      if (data.cached === true) cacheHits++;
    }
    expect(cacheHits).toBeGreaterThanOrEqual(24);
  }, 120000);
});
