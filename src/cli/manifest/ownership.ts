import { resolve, relative, sep } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export interface OwnershipViolation {
  file: string;
  zone: "LOCKED" | "MACHINE" | "AGENT" | "OPERATOR";
}

export function determineOwnershipZones(cwd: string, context: AgentContext): OwnershipViolation[] {
  const violations: OwnershipViolation[] = [];
  const locked = new Set(Object.keys(context.integrity.lockedFiles));
  const machine = new Set(Object.keys(context.integrity.machineFiles));

  function zoneOf(file: string): "LOCKED" | "MACHINE" | "AGENT" | "OPERATOR" {
    if (locked.has(file)) return "LOCKED";
    if (machine.has(file)) return "MACHINE";
    if (file === "tokens.json") return "OPERATOR";
    if (file.startsWith(`src${sep}components`) || file.startsWith(`src${sep}state`) || file.startsWith("e2e")) return "AGENT";
    if (file.startsWith(`src${sep}core`) || file.startsWith(`src${sep}generated`) || file.startsWith(`src${sep}routes`)) return "MACHINE";
    return "AGENT";
  }

  for (const component of context.components) {
    const rel = relative(cwd, resolve(cwd, component.file)).replace(/\\/g, "/");
    if (zoneOf(rel) === "LOCKED") {
      violations.push({ file: rel, zone: "LOCKED" });
    }
  }

  return violations;
}
