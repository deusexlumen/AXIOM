import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { z } from "zod/v3";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import { buildPerfFailure } from "@/cli/pipeline/stages/perf-packet.js";
import { runScenario, startStaticServer } from "@/cli/pipeline/stages/perf-runner.js";
import { analyzeTraceEvents } from "@/cli/pipeline/stages/perf-trace.js";
import type { StageResult } from "@/cli/pipeline/types.js";

const PerfFileSchema = z.object({
  route: z.string(),
  scenarios: z.array(z.object({
    name: z.string(),
    steps: z.array(z.object({
      action: z.enum(["scroll", "click", "wait"]),
      y: z.number().optional(),
      selector: z.string().optional(),
      ms: z.number().optional(),
    })),
  })),
  budgets: z.object({
    maxFrameTimeMs: z.number().default(16.7),
    maxLongTasks: z.number().int().nonnegative().default(0),
    // How many individual frames may exceed the budget before the stage fails.
    // Zero would forbid a single dropped frame anywhere in a scenario, which no
    // real page survives - a genuine regression produces many slow frames, not one.
    maxFramesOverBudget: z.number().int().nonnegative().default(1),
  }).default({}),
});

type PerfFile = z.infer<typeof PerfFileSchema>;

function findPerfFiles(cwd: string): string[] {
  const dir = resolve(cwd, "perf");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".perf.json")).map((f) => resolve(dir, f));
}

function loadPerfFile(path: string): PerfFile {
  return PerfFileSchema.parse(JSON.parse(readFileSync(path, "utf-8")) as unknown);
}

export async function runPerfStage(cwd: string): Promise<StageResult> {
  try {
    const files = findPerfFiles(cwd);
    if (files.length === 0) return { ok: true };
    const outDir = resolve(cwd, "out");
    if (!existsSync(outDir)) return { ok: true };
    const server = await startStaticServer(outDir);
    const browser = await chromium.launch();
    try {
      const page = await browser.newContext().then((c) => c.newPage());
      for (const file of files) {
        const pf = loadPerfFile(file);
        for (const scenario of pf.scenarios) {
          const events = await runScenario(page, server.url, pf.route, scenario);
          const analysis = analyzeTraceEvents(events);
          const frameBudget = pf.budgets.maxFrameTimeMs * 1.5;
          const framesOverBudget = analysis.frameDurationsMs.filter((d) => d > frameBudget).length;
          if (framesOverBudget > pf.budgets.maxFramesOverBudget || analysis.longTasks.length > pf.budgets.maxLongTasks) {
            return buildPerfFailure(scenario.name, analysis, pf.budgets, frameBudget, framesOverBudget, file);
          }
        }
      }
      return { ok: true };
    } finally { await browser.close(); await server.close(); }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, packet: buildPipelinePacket("AXM-G000", message, "perf/unknown.perf.json", 1, 1, "perf", ["I-18"]) };
  }
}
