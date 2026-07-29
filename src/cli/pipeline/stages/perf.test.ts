import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { startStaticServer } from "@/cli/pipeline/stages/perf-runner.js";
import { runPerfStage } from "@/cli/pipeline/stages/perf.js";
import { type TraceEvent } from "@/cli/pipeline/stages/perf-trace.js";
import { buildPerfFailure } from "@/cli/pipeline/stages/perf-packet.js";

const mockEvents: TraceEvent[] = [];

vi.mock("@playwright/test", () => {
  const page = { goto: vi.fn() };
  const browser = { close: vi.fn(), newContext: vi.fn(async () => ({ newPage: vi.fn(async () => page) })) };
  return { chromium: { launch: vi.fn(async () => browser) } };
});

vi.mock("@/cli/pipeline/stages/perf-runner.js", () => {
  const server = { url: "http://127.0.0.1:9999", close: vi.fn() };
  return { startStaticServer: vi.fn(async () => server), runScenario: vi.fn(async () => mockEvents) };
});

function scenario(): string {
  return JSON.stringify({ route: "/", scenarios: [{ name: "jank", steps: [{ action: "wait", ms: 10 }] }], budgets: { maxFrameTimeMs: 16.7, maxLongTasks: 0 } });
}

describe("runPerfStage", () => {
  let baseDir: string;
  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "p-"));
    mkdirSync(join(baseDir, "perf"));
    mkdirSync(join(baseDir, "out"));
    writeFileSync(join(baseDir, "out", "index.html"), "<html></html>");
    mockEvents.length = 0;
    vi.clearAllMocks();
  });
  afterEach(() => { rmSync(baseDir, { recursive: true, force: true }); });

  it("returns ok when no perf scenarios exist", async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "e-"));
    try { expect((await runPerfStage(emptyDir)).ok).toBe(true); } finally { rmSync(emptyDir, { recursive: true, force: true }); }
  });

  it("returns AXM-G001 when a frame exceeds the budget", async () => {
    const ts = performance.now() * 1000;
    mockEvents.push({ name: "choreo:jank:start", ph: "I", ts }, { name: "DrawFrame", ph: "I", ts: ts + 16000 }, { name: "DrawFrame", ph: "I", ts: ts + 50000 });
    writeFileSync(join(baseDir, "perf", "jank.perf.json"), scenario());
    const r = await runPerfStage(baseDir);
    expect(r.ok).toBe(false);
    expect(r.packet?.errorCode).toBe("AXM-G001");
    expect(r.packet?.invariantsAffected).toEqual(["I-18"]);
    expect(r.packet?.probableCause).toContain("jank");
  });

  it("returns AXM-G001 when long task budget is exceeded", async () => {
    mockEvents.push({ name: "DrawFrame", ph: "I", ts: 1000 }, { name: "DrawFrame", ph: "I", ts: 2000 }, { name: "RunTask", ph: "X", ts: 3000, dur: 100000 });
    writeFileSync(join(baseDir, "perf", "longtask.perf.json"), scenario());
    const r = await runPerfStage(baseDir);
    expect(r.ok).toBe(false);
    expect(r.packet?.errorCode).toBe("AXM-G001");
    expect(r.packet?.probableCause).toContain("Long task budget exceeded");
    expect(r.packet?.fixHint).toContain("smaller chunks");
  });

  it("closes browser and server after running", async () => {
    writeFileSync(join(baseDir, "perf", "ok.perf.json"), scenario());
    await runPerfStage(baseDir);
    const browser = await chromium.launch();
    const server = await startStaticServer(baseDir);
    expect(browser.close).toHaveBeenCalled();
    expect(server.close).toHaveBeenCalled();
  });
});

describe("buildPerfFailure", () => {
  it("sets AXM-G001 with I-18 and attribution", () => {
    const a = { p95FrameMs: 20, p99FrameMs: 100, worstFrames: [{ ts: 0, durationMs: 100 }], longTasks: [], attributedChoreoId: "hero" };
    const r = buildPerfFailure("scroll-hero", a, 16.7, 0, 25.05, "perf/hero.perf.json");
    expect(r.ok).toBe(false);
    expect(r.packet?.errorCode).toBe("AXM-G001");
    expect(r.packet?.target.file).toBe("perf/hero.perf.json");
    expect(r.packet?.invariantsAffected).toEqual(["I-18"]);
    expect(r.packet?.fixHint).toContain("smaller timelines");
    expect(r.packet?.probableCause).toContain("hero");
  });
});
