import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";

async function hashAgentContextManifest(cwd: string): Promise<string> {
  const content = await readFile(resolve(cwd, "agent-context.json"), "utf-8");
  const parsed = JSON.parse(content) as AgentContext;
  delete parsed.integrity.machineFiles["agent-context.json"];
  const canonical = `${JSON.stringify(parsed, null, 2)}\n`.replace(/\r\n/g, "\n");
  return hashString(canonical);
}

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

export async function verifyIntegrity(
  cwd: string,
  context: AgentContext
): Promise<IntegrityViolation[]> {
  const violations: IntegrityViolation[] = [];
  const all = { ...context.integrity.lockedFiles, ...context.integrity.machineFiles };

  for (const [file, expected] of Object.entries(all)) {
    let actual: string | null = null;
    try {
      actual = file === "agent-context.json" ? await hashAgentContextManifest(cwd) : await hashFile(resolve(cwd, file));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
      actual = null;
    }
    if (actual !== expected) {
      violations.push({ file, expected, actual });
    }
  }

  return violations;
}
