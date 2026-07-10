import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { getOwnershipZone } from "@/cli/manifest/ownership.js";

export function isPathAllowed(file: string, context: AgentContext): boolean {
  const normalized = file.replace(/\\/g, "/").replace(/^\.\//, "");
  if (normalized.startsWith("/") || normalized.includes("..")) return false;
  return getOwnershipZone(normalized, context) === "AGENT";
}
