import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { VISUAL_CONFIG } from "@/cli/visual/config.js";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export interface VisualPaths {
  actual: string;
  baseline: string;
  diff: string;
}

export function visualPaths(cwd: string, component: string): VisualPaths {
  const dir = resolve(cwd, "pipeline/visual");
  return {
    actual: resolve(dir, `${component}.actual.png`),
    baseline: resolve(dir, `${component}.baseline.png`),
    diff: resolve(dir, `${component}.diff.png`),
  };
}

export function parseDiffRatio(output: string): number {
  const trimmed = output.trim();
  if (!trimmed.includes(";")) return 0;
  const percent = trimmed.split(";")[1];
  return Number(percent) / 100;
}

function resolveOdiffPath(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("odiff-bin/package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { bin?: Record<string, string> };
  return resolve(dirname(pkgPath), pkg.bin?.odiff ?? "odiff");
}

export function runDiff(cwd: string, component: string): StageResult & { ratio?: number } {
  const paths = visualPaths(cwd, component);

  if (!existsSync(paths.baseline)) {
    return {
      ok: false,
      packet: buildPipelinePacket(
        "AXM-E021",
        `Baseline screenshot missing: ${paths.baseline}`,
        paths.baseline,
        1,
        1,
        "e2e",
        []
      ),
    };
  }

  try {
    const stdout = execSync(
      `"${resolveOdiffPath()}" "${paths.baseline}" "${paths.actual}" "${paths.diff}" --parsable-stdout`,
      { cwd, encoding: "utf-8", stdio: "pipe" }
    );
    return { ok: true, ratio: parseDiffRatio(stdout) };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "");
    const stderr = String((error as { stderr?: Buffer }).stderr ?? "");
    const exitCode = (error as { status?: number }).status;
    const ratio = parseDiffRatio(stdout);

    if (exitCode === 22 && ratio > VISUAL_CONFIG.diffThreshold) {
      return {
        ok: false,
        ratio,
        packet: buildPipelinePacket(
          "AXM-E020",
          `Visual diff ratio ${ratio.toFixed(4)} exceeds threshold ${VISUAL_CONFIG.diffThreshold}`,
          paths.actual,
          1,
          1,
          "e2e",
          [],
          { baseline: paths.baseline, actual: paths.actual, diff: paths.diff, ratio }
        ),
      };
    }

    if (exitCode === 22) {
      return { ok: true, ratio };
    }

    return {
      ok: false,
      packet: buildPipelinePacket(
        "AXM-E020",
        stderr || stdout || "odiff failed",
        paths.actual,
        1,
        1,
        "e2e",
        []
      ),
    };
  }
}
