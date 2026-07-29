import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { runPipeline } from "@/cli/pipeline/runner.js";
import type { StageResult } from "@/cli/pipeline/types.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("runPipeline", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-pipeline-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns GREEN when all stages pass", async () => {
    const stages = [{ name: "validate" as const, run: async () => ({ ok: true }) }];
    const report = await runPipeline(baseDir, stages, { out: noopStream() });
    expect(report.result).toBe("GREEN");
    expect(report.failedStage).toBeNull();
  });

  it("stops at first red stage and returns RED", async () => {
    const stages = [
      {
        name: "validate" as const,
        run: async (): Promise<StageResult> => ({
          ok: false,
          packet: { errorCode: "AXM-V001" } as StageResult["packet"],
        }),
      },
      { name: "typecheck" as const, run: async () => ({ ok: true }) },
    ];
    const report = await runPipeline(baseDir, stages, { out: noopStream() });
    expect(report.result).toBe("RED");
    expect(report.failedStage).toBe("validate");
    expect(report.packetFile).toMatch(/^pipeline\/fix-packets\/run_\d+\.ndjson$/);
  });
});
