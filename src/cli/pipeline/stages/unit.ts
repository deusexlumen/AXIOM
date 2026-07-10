import { execSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

type AssertionResult = {
  status: string;
  fullName: string;
  failureMessages: string[];
  location?: { line: number };
};

type TestResult = { status: string; name: string; assertionResults: AssertionResult[] };

type VitestReport = { testResults?: TestResult[] };

function extractLastJson(stdout: string): VitestReport {
  const clean = stdout.replace(/\x1b\[[0-9;]*m/g, "");
  let end = clean.length - 1;
  while (end >= 0 && clean[end] !== "}" && clean[end] !== "]") {
    end--;
  }
  if (end < 0) return {};
  const close = clean[end];
  const open = close === "}" ? "{" : "[";
  let depth = 1;
  let i = end - 1;
  while (i >= 0 && depth > 0) {
    if (clean[i] === close) depth++;
    else if (clean[i] === open) depth--;
    i--;
  }
  if (depth !== 0) return {};
  try {
    return JSON.parse(clean.slice(i + 1, end + 1)) as VitestReport;
  } catch {
    return {};
  }
}

export async function runUnitStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm vitest run --reporter=json", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "{}");
    const report = extractLastJson(stdout);
    const failed = report.testResults?.find((r) => r.status === "failed");
    const first = failed?.assertionResults.find((a) => a.status === "failed");
    const file = failed?.name
      ? relative(cwd, resolve(cwd, failed.name)).replace(/\\/g, "/")
      : "src/components/Unknown.test.tsx";
    const message = first?.failureMessages[0]?.split("\n")[0] ?? "Unit test failed";
    return {
      ok: false,
      packet: buildPipelinePacket(
        "AXM-U001",
        message,
        file,
        first?.location?.line ?? 1,
        1,
        "unit",
        ["I-07"],
        { testName: first?.fullName }
      ),
    };
  }
}
