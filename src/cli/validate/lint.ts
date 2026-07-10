import { ESLint } from "eslint";
import { resolve, relative } from "node:path";
import { access } from "node:fs/promises";
import { buildFixPacket } from "@/cli/validate/packet.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

const RULE_MAP: Record<string, { code: string; invariants: string[]; fixHint: string; cause: string }> = {
  "axiom/max-loc": {
    code: "AXM-V001",
    invariants: ["I-01"],
    fixHint: "Split the file using 'axm split' or extract helpers.",
    cause: "Component file exceeds the maximum allowed lines of code.",
  },
  "axiom/no-default-export": {
    code: "AXM-V004",
    invariants: ["I-04"],
    fixHint: "Convert the default export to a named export.",
    cause: "Component file uses a forbidden default export.",
  },
  "axiom/no-barrel": {
    code: "AXM-V005",
    invariants: ["I-05"],
    fixHint: "Import directly from the source file instead of re-exporting.",
    cause: "Component file is a barrel file.",
  },
  "axiom/absolute-imports": {
    code: "AXM-V006",
    invariants: ["I-06"],
    fixHint: "Replace the relative import with the @/ alias.",
    cause: "Component file uses a relative import.",
  },
  "axiom/tokens-only": {
    code: "AXM-V008",
    invariants: ["I-08"],
    fixHint: "Replace raw values with token references.",
    cause: "Component file contains raw colors or pixel values.",
  },
  "axiom/no-escape-hatch": {
    code: "AXM-V009",
    invariants: ["I-09"],
    fixHint: "Remove the escape hatch and type the code correctly.",
    cause: "Component file uses any, @ts-ignore, or eslint-disable.",
  },
  "axiom/static-imports": {
    code: "AXM-V012",
    invariants: ["I-12"],
    fixHint: "Use a static import with a literal module specifier.",
    cause: "Component file uses a dynamic import with a variable path.",
  },
  "axiom/require-axm-id": {
    code: "AXM-E002",
    invariants: ["I-13"],
    fixHint: "Add data-axm-id=\"<ComponentName>\" to the root JSX element.",
    cause: "Component root element does not render the required data-axm-id attribute.",
  },
};

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
