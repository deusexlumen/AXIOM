import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

type E2eResult = { error?: { message: string } };
type E2eTest = { results: E2eResult[] };
type E2eSpec = { ok: boolean; title: string; tests?: E2eTest[] };
type E2eSuite = { file?: string; specs?: E2eSpec[] };
type E2eError = { message: string };
type E2eReport = { suites?: E2eSuite[]; errors?: E2eError[] };

function hasE2eSpecs(cwd: string): boolean {
  try {
    return readdirSync(resolve(cwd, "e2e")).some((f) => f.endsWith(".spec.ts") || f.endsWith(".spec.tsx"));
  } catch {
    return false;
  }
}

function extractLastJson(stdout: string): E2eReport {
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
    return JSON.parse(clean.slice(i + 1, end + 1)) as E2eReport;
  } catch {
    return {};
  }
}

function isA11yViolation(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("accessibility") || lower.includes("axe");
}

export async function runE2eStage(cwd: string): Promise<StageResult> {
  try {
    if (!hasE2eSpecs(cwd)) return { ok: true };
    try {
      execSync("pnpm playwright test --reporter=json", { cwd, stdio: "pipe" });
      return { ok: true };
    } catch (error) {
      const stdout = String((error as { stdout?: Buffer }).stdout ?? "{}") || "{}";
      const stderr = String((error as { stderr?: Buffer }).stderr ?? "");
      const report = extractLastJson(stdout);
      if (report.errors?.some((e) => e.message.includes("No tests found"))) {
        return { ok: true };
      }
      const suite = report.suites?.find((s) => s.specs?.some((sp) => !sp.ok));
      const spec = suite?.specs?.find((sp) => !sp.ok);
      const file = suite?.file ?? "e2e/Unknown.spec.ts";
      const message = spec?.tests?.[0]?.results?.[0]?.error?.message ?? stderr ?? "E2E test failed";
      if (isA11yViolation(message)) {
        return {
          ok: false,
          packet: buildPipelinePacket("AXM-E010", message, file, 1, 1, "e2e", ["I-13", "I-09"], { testName: spec?.title }),
        };
      }
      return {
        ok: false,
        packet: buildPipelinePacket("AXM-E001", message, file, 1, 1, "e2e", ["I-13"], { testName: spec?.title }),
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-E001", message, "e2e/Unknown.spec.ts", 1, 1, "e2e", ["I-13"]),
    };
  }
}
