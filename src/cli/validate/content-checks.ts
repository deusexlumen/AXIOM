import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { buildFixPacket } from "@/cli/validate/packet.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

const MAX_LOC = 120;

function pos(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  return { line: before.split("\n").length, column: index - (before.lastIndexOf("\n") + 1) + 1 };
}

async function checkEach(
  context: AgentContext,
  cwd: string,
  regex: RegExp,
  code: string,
  message: string,
  invariants: string[],
  hint: string,
  cause: string
): Promise<FixPacket | null> {
  for (const component of context.components) {
    const content = await readFile(resolve(cwd, component.file), "utf-8");
    const m = regex.exec(content);
    if (m !== null) {
      const p = pos(content, m.index);
      return buildFixPacket(code, message, component.file, invariants, hint, cause, p.line, p.column);
    }
  }
  return null;
}

export async function checkLocLimit(cwd: string, context: AgentContext) {
  for (const component of context.components) {
    const content = await readFile(resolve(cwd, component.file), "utf-8");
    const loc = content.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("//");
    }).length;
    if (loc > MAX_LOC) {
      return buildFixPacket("AXM-V001", "Component file exceeds 120 lines of code.", component.file, ["I-01"], "Split the file using 'axm split' or remove redundant code.", "Component file grew beyond the hard LOC budget.");
    }
  }
  return null;
}

export function checkDefaultExport(cwd: string, context: AgentContext) {
  return checkEach(context, cwd, /export\s+default\s+/u, "AXM-V004", "Default export is not allowed.", ["I-04"], "Convert the default export to a named export.", "Component file uses a default export.");
}

export function checkBarrelFile(cwd: string, context: AgentContext) {
  return checkEach(context, cwd, /export\s+.*\s+from\s+/u, "AXM-V005", "Barrel file detected.", ["I-05"], "Remove re-exports and keep only the component's named export.", "Component file re-exports symbols from another module.");
}

export function checkRelativeImport(cwd: string, context: AgentContext) {
  return checkEach(context, cwd, /from\s+['"]\.\//u, "AXM-V006", "Relative import is not allowed.", ["I-06"], "Replace the relative import with an absolute '@/' alias import.", "Component file imports from a relative path.");
}

export function checkRawValues(cwd: string, context: AgentContext) {
  return checkEach(context, cwd, /#[0-9a-fA-F]{3,8}\b|\d+px\b/u, "AXM-V008", "Raw color or pixel value detected.", ["I-08"], "Replace the raw value with a design-token reference.", "Component file contains a hex color or pixel dimension.");
}

export function checkEscapeHatches(cwd: string, context: AgentContext) {
  return checkEach(context, cwd, /\/\/\s*@ts-ignore|\/\/\s*eslint-disable|:\s*any\s*[;,=)]/u, "AXM-V009", "Escape hatch detected.", ["I-09"], "Remove the escape hatch and add a proper type or fix the underlying issue.", "Component file contains @ts-ignore, eslint-disable, or an explicit any type.");
}

export async function checkDynamicImports(cwd: string, context: AgentContext) {
  for (const component of context.components) {
    const content = await readFile(resolve(cwd, component.file), "utf-8");
    for (const line of content.split("\n")) {
      if (/import\s*\(/u.test(line) && !/import\s*\(\s*['"]/u.test(line)) {
        const p = pos(content, content.indexOf(line));
        return buildFixPacket("AXM-V012", "Dynamic import with variable path detected.", component.file, ["I-12"], "Replace the dynamic import with a static import or a constant string literal path.", "Component file uses a dynamic import with a non-literal path.", p.line, p.column);
      }
    }
  }
  return null;
}
