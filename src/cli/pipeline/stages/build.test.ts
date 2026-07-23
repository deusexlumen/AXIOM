import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { runBuildStage } from "@/cli/pipeline/stages/build.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

const execaResult = { stdout: "", stderr: "", command: "pnpm build", escapedCommand: "pnpm build", exitCode: 0 } as unknown as Awaited<ReturnType<typeof execa>>;

describe("runBuildStage", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-build-stage-test-"));
    vi.mocked(execa).mockReset();
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns ok when pnpm build succeeds and out/ exists", async () => {
    mkdirSync(join(baseDir, "out"));
    vi.mocked(execa).mockResolvedValue(execaResult);
    const result = await runBuildStage(baseDir);
    expect(result.ok).toBe(true);
    expect(vi.mocked(execa)).toHaveBeenCalledWith("pnpm", ["build"], { cwd: baseDir, stdio: "pipe" });
  });

  it("returns AXM-B001 packet when pnpm build fails", async () => {
    vi.mocked(execa).mockRejectedValue(new Error("Build failed") as unknown as Error);
    const result = await runBuildStage(baseDir);
    expect(result.ok).toBe(false);
    expect(vi.mocked(execa)).toHaveBeenCalledWith("pnpm", ["build"], { cwd: baseDir, stdio: "pipe" });
    expect(result.packet?.errorCode).toBe("AXM-B001");
    expect(result.packet?.stage).toBe("build");
    expect(result.packet?.invariantsAffected).toEqual(["I-09"]);
  });

  it("returns AXM-B002 packet when out/ is missing after build", async () => {
    vi.mocked(execa).mockResolvedValue(execaResult);
    const result = await runBuildStage(baseDir);
    expect(result.ok).toBe(false);
    expect(result.packet?.errorCode).toBe("AXM-B002");
    expect(result.packet?.message).toBe("Build completed but output directory 'out/' is missing");
  });
});
