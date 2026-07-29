import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { determineOwnershipZones } from "@/cli/manifest/ownership.js";
import { buildFixPacket } from "@/cli/validate/packet.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import {
  checkLocLimit,
  checkDefaultExport,
  checkBarrelFile,
  checkRelativeImport,
  checkRawValues,
  checkEscapeHatches,
  checkDynamicImports,
} from "@/cli/validate/content-checks.js";

const MAX_BYTES = 4096;

export {
  checkLocLimit,
  checkDefaultExport,
  checkBarrelFile,
  checkRelativeImport,
  checkRawValues,
  checkEscapeHatches,
  checkDynamicImports,
};

export async function checkByteCap(cwd: string, context: AgentContext) {
  for (const component of context.components) {
    const filePath = resolve(cwd, component.file);
    const content = await readFile(filePath);
    if (content.length > MAX_BYTES) {
      return buildFixPacket(
        "AXM-V002",
        `File ${component.file} exceeds ${MAX_BYTES} bytes (${content.length}).`,
        component.file,
        ["I-02"],
        "Split the file using 'axm split' or reduce its size.",
        "Component file grew beyond the hard byte budget."
      );
    }
  }
  return null;
}

export async function checkSingleExport(cwd: string, context: AgentContext) {
  for (const component of context.components) {
    const filePath = resolve(cwd, component.file);
    const content = await readFile(filePath, "utf-8");
    const exportMatches = content.match(/^export\s+/gmu);
    const count = exportMatches?.length ?? 0;
    if (count !== 1) {
      return buildFixPacket(
        "AXM-V003",
        `File ${component.file} has ${count} exports; exactly 1 named export is required.`,
        component.file,
        ["I-03"],
        "Extract additional exports into separate files via 'axm split'.",
        "Component file exports more or fewer than one symbol."
      );
    }
  }
  return null;
}

export async function checkSidecar(cwd: string, context: AgentContext) {
  for (const component of context.components) {
    try {
      await readFile(resolve(cwd, component.spec), "utf-8");
    } catch {
      return buildFixPacket(
        "AXM-V007",
        `Missing sidecar ${component.spec} for component ${component.name}.`,
        component.file,
        ["I-07"],
        `Create ${component.spec} or re-run 'axm add component ${component.name}'.`,
        "Component listed in agent-context.json but sidecar file is missing."
      );
    }
  }
  return null;
}

export function checkOwnership(cwd: string, context: AgentContext) {
  const violations = determineOwnershipZones(cwd, context);
  if (violations.length > 0) {
    const file = violations[0]!.file;
    return buildFixPacket(
      "AXM-V010",
      `Ownership violation: ${violations.map((v) => `${v.file} is ${v.zone}`).join(", ")}`,
      file,
      ["I-10"],
      "Move the file to an AGENT-owned directory or use 'axm' commands for MACHINE zones.",
      "Agent attempted to write a LOCKED or MACHINE file directly."
    );
  }
  return null;
}

export async function checkIntegrity(cwd: string, context: AgentContext) {
  const violations = await verifyIntegrity(cwd, context);
  if (context.tokens.file) {
    const actual = await hashFile(resolve(cwd, context.tokens.file));
    if (actual !== context.tokens.hash) {
      violations.push({ file: context.tokens.file, expected: context.tokens.hash, actual });
    }
  }
  const frozenDirectionFile = context.direction?.file;
  const index = violations.findIndex((v) => v.file === frozenDirectionFile);
  if (index !== -1) {
    violations.splice(index, 1);
  }
  if (violations.length > 0) {
    const file = violations[0]!.file;
    return buildFixPacket(
      "AXM-V011",
      `Hash mismatch: ${violations.map((v) => v.file).join(", ")}`,
      file,
      ["I-10"],
      "Re-run 'axm init' or restore the original file.",
      "File changed after manifest was written."
    );
  }
  return null;
}

export async function checkDirectionFreeze(cwd: string, context: AgentContext) {
  if (!context.direction) return null;
  const filePath = resolve(cwd, context.direction.file);
  const actual = await hashFile(filePath);
  if (actual !== context.direction.hash) {
    return buildFixPacket(
      "AXM-R002",
      `Direction hash drift: ${context.direction.file} was changed after freeze at ${context.direction.frozenAt ?? "unknown"}.`,
      context.direction.file,
      ["I-20"],
      "Use 'atl direct amend --reason <text>' to update the frozen hash, or restore the original file.",
      "Agent mutated a frozen DIRECTION.axm.json without amending."
    );
  }
  return null;
}
