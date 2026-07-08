import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { serializeAgentContext } from "@/cli/manifest/writer.js";

export interface IntegrityViolation {
  file: string;
  expected: string;
  actual: string | null;
}

export async function computeIntegrity(
  cwd: string,
  lockedFiles: string[],
  machineFiles: string[]
): Promise<{ locked: Record<string, string>; machine: Record<string, string> }> {
  const locked: Record<string, string> = {};
  const machine: Record<string, string> = {};

  for (const file of lockedFiles) {
    locked[file] = await hashFile(resolve(cwd, file));
  }
  for (const file of machineFiles) {
    machine[file] = await hashFile(resolve(cwd, file));
  }

  return { locked, machine };
}

function hashAgentContextManifest(context: AgentContext): string {
  const copy = structuredClone(context);
  delete copy.integrity.machineFiles["agent-context.json"];
  return hashString(serializeAgentContext(copy));
}

export async function verifyIntegrity(
  cwd: string,
  context: AgentContext
): Promise<IntegrityViolation[]> {
  const violations: IntegrityViolation[] = [];
  const all = { ...context.integrity.lockedFiles, ...context.integrity.machineFiles };

  for (const [file, expected] of Object.entries(all)) {
    let actual: string | null = null;

    if (file === "agent-context.json") {
      actual = hashAgentContextManifest(context);
    } else {
      try {
        actual = await hashFile(resolve(cwd, file));
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          throw error;
        }
        actual = null;
      }
    }

    if (actual !== expected) {
      violations.push({ file, expected, actual });
    }
  }

  return violations;
}
