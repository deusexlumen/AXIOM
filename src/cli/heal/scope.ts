import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { getOwnershipZone } from "@/cli/manifest/ownership.js";

export function isPathAllowed(file: string, context: AgentContext): boolean {
  if (file.startsWith("/") || file.includes("..")) return false;
  return getOwnershipZone(file, context) === "AGENT";
}
