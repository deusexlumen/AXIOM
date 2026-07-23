import { resolve, relative } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export interface OwnershipViolation {
  file: string;
  zone: "LOCKED" | "MACHINE" | "AGENT" | "OPERATOR";
}

export type OwnershipZone = OwnershipViolation["zone"] | "UNKNOWN";

export function getOwnershipZone(file: string, context: AgentContext): OwnershipZone {
  const locked = new Set(Object.keys(context.integrity.lockedFiles));
  const machine = new Set(Object.keys(context.integrity.machineFiles));

  if (locked.has(file)) return "LOCKED";
  if (machine.has(file)) return "MACHINE";
  if (file === "tokens.json") return "OPERATOR";
  if (file.startsWith("src/components") || file.startsWith("src/state") || file.startsWith("e2e") || file.startsWith("perf")) return "AGENT";
  if (file.startsWith("src/core") || file.startsWith("src/generated") || file.startsWith("src/routes")) return "MACHINE";
  if (/^src\/[^/]+\.tsx?$/.test(file)) return "AGENT";
  if (file.startsWith("api/generated")) return "MACHINE";
  if (file.startsWith("api/contracts") || file.startsWith("api/handlers")) return "AGENT";
  return "UNKNOWN";
}

export function determineOwnershipZones(cwd: string, context: AgentContext): OwnershipViolation[] {
  const violations: OwnershipViolation[] = [];

  for (const component of context.components) {
    const rel = relative(cwd, resolve(cwd, component.file)).replace(/\\/g, "/");
    if (getOwnershipZone(rel, context) === "LOCKED") {
      violations.push({ file: rel, zone: "LOCKED" });
    }
  }

  return violations;
}
