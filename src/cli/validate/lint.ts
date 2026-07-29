import { ESLint } from "eslint";
import { resolve, relative } from "node:path";
import { access } from "node:fs/promises";
import { buildFixPacket } from "@/cli/validate/packet.js";
import { RULE_MAP } from "@/cli/validate/rule-map.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export async function runEslintChecks(cwd: string, files: string[]): Promise<FixPacket | null> {
  if (files.length === 0) return null;

  const configPath = resolve(cwd, "eslint.config.js");
  try {
    await access(configPath);
  } catch {
    return null;
  }

  const eslint = new ESLint({ cwd });
  const results = await eslint.lintFiles(files);

  for (const result of results) {
    for (const message of result.messages) {
      const ruleId = message.ruleId ?? "";
      const mapping = RULE_MAP[ruleId];
      if (mapping === undefined) continue;
      const file = relative(cwd, result.filePath).replace(/\\/g, "/");
      return buildFixPacket(
        mapping.code,
        `${ruleId}: ${message.message}`,
        file,
        mapping.invariants,
        mapping.fixHint,
        mapping.cause,
        message.line,
        message.column
      );
    }
  }
  return null;
}
