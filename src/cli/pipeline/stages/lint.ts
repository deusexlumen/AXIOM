import { execSync } from "node:child_process";
import { relative } from "node:path";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

type EslintMessage = { line: number; column: number; message: string; ruleId?: string };
type EslintResult = { filePath: string; messages: EslintMessage[] };

const CONFIG_FILES = new Set([
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "vite.config.ts",
  "vitest.config.ts",
  "playwright.config.ts",
]);

function isConfigFile(file: string): boolean {
  return CONFIG_FILES.has(file) || file.startsWith("packages/");
}

function toRelative(cwd: string, filePath: string): string {
  return relative(cwd, filePath).replace(/\\/g, "/");
}

function isSrcFile(file: string): boolean {
  return file.startsWith("src/") && !isConfigFile(file);
}

export async function runLintStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm eslint . --format json", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "[]");
    const results = JSON.parse(stdout) as EslintResult[];
    const candidates = results
      .filter((r) => r.messages.length > 0 && !isConfigFile(toRelative(cwd, r.filePath)))
      .sort((a, b) => {
        const aFile = toRelative(cwd, a.filePath);
        const bFile = toRelative(cwd, b.filePath);
        return Number(!isSrcFile(aFile)) - Number(!isSrcFile(bFile));
      });
    const firstResult = candidates[0];
    if (firstResult === undefined) {
      return { ok: true };
    }
    const firstMessage = firstResult.messages[0];
    if (firstMessage === undefined) {
      return {
        ok: false,
        packet: buildPipelinePacket("AXM-L001", "ESLint failed", "src/components/Unknown.tsx", 1, 1, "lint", ["I-09"]),
      };
    }
    const file = toRelative(cwd, firstResult.filePath);
    return {
      ok: false,
      packet: buildPipelinePacket(
        "AXM-L001",
        `${firstMessage.ruleId ?? "eslint"}: ${firstMessage.message}`,
        file,
        firstMessage.line,
        firstMessage.column,
        "lint",
        ["I-01", "I-04", "I-05", "I-06", "I-08", "I-09", "I-12"],
        { ruleId: firstMessage.ruleId }
      ),
    };
  }
}
