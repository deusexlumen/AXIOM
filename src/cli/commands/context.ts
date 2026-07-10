import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContext } from "@/cli/manifest/mutate.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { readCachedSlice, writeCachedSlice, computeSliceCacheKey } from "@/cli/context/slice-cache.js";
import { logSliceCost } from "@/cli/ledger/cost.js";
import { findEntry, findComponent, pushFile, pushComponent, type SliceFile } from "@/cli/context/slice-files.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";

export async function contextSliceCommand(options: {
  target?: string;
  orderId?: string;
  cwd?: string;
  out?: NodeJS.WritableStream;
}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  if (!options.target) {
    throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", "Missing required argument: --for <file>", ["I-11"])), ExitCode.VALIDATION_ERROR);
  }
  const ctx = await readContext(cwd);
  const entry = findEntry(ctx, options.target);
  if (!entry) {
    throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", `File not found in context: ${options.target}`, ["I-11"])), ExitCode.VALIDATION_ERROR);
  }
  const key = await computeSliceCacheKey(cwd, options.target, ctx);
  const cached = await readCachedSlice(cwd, key);
  if (cached) {
    const out = options.out ?? process.stdout;
    out.write(`${JSON.stringify({ ok: true, cached: true, target: cached.target, tokenCount: cached.tokenCount, files: cached.files })}\n`);
    await logSliceCost(cwd, cached.target, cached.tokenCount, options.orderId, true, 0);
    return;
  }
  let orderLimit: number | undefined;
  if (options.orderId) {
    try {
      const raw = await readFile(resolve(cwd, "orders", "active", `${options.orderId}.json`), "utf-8");
      orderLimit = WorkOrder.parse(JSON.parse(raw)).tokenBudget;
    } catch {
      orderLimit = undefined;
    }
  }
  const start = Date.now();
  const files: SliceFile[] = [];
  await pushFile(files, cwd, entry.file);
  if ("spec" in entry) await pushFile(files, cwd, entry.spec);
  if ("test" in entry) await pushFile(files, cwd, entry.test);
  if ("dependsOn" in entry) {
    for (const dep of entry.dependsOn) {
      const comp = findComponent(ctx, dep);
      if (comp) await pushComponent(files, cwd, comp);
    }
  }
  if ("usedBy" in entry) {
    for (const dep of entry.usedBy) {
      const comp = findComponent(ctx, dep);
      if (comp) await pushComponent(files, cwd, comp);
    }
  }
  await pushFile(files, cwd, ctx.tokens.file);
  const tokenCount = Math.ceil(JSON.stringify(files).length / 4);
  const hardLimit = orderLimit ?? ctx.project.tokenBudget.hardLimitPerSlice;
  if (tokenCount > hardLimit) {
    throw new CliError(JSON.stringify(cliFixPacket("AXM-B001", `Slice token count ${tokenCount} exceeds hard limit ${hardLimit}`, ["I-01", "I-02"])), ExitCode.BUDGET_ERROR);
  }
  const data = {
    ok: true as const,
    cached: false as const,
    target: options.target,
    tokenCount,
    files,
    latencyMs: Date.now() - start,
    warning: tokenCount > ctx.project.tokenBudget.warnAt ? "Slice token count exceeds warn threshold" : undefined,
  };
  await writeCachedSlice(cwd, { key, target: options.target, tokenCount, files, createdAt: new Date().toISOString() });
  const out = options.out ?? process.stdout;
  out.write(`${JSON.stringify(data)}\n`);
  await logSliceCost(cwd, data.target, data.tokenCount, options.orderId, false, data.latencyMs);
}
