import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { getOwnershipZone } from "@/cli/manifest/ownership.js";

const AGENT_PREFIXES = [
  "src/components/",
  "src/state/",
  "e2e/",
  "api/contracts/",
  "api/handlers/",
];

export function isPathAllowed(file: string, context: AgentContext): boolean {
  if (file.startsWith("/") || file.includes("..")) return false;
  if (file.startsWith("src/routes/")) return true;
  const zone = getOwnershipZone(file, context);
  if (zone === "LOCKED" || zone === "MACHINE" || zone === "OPERATOR") return false;
  return AGENT_PREFIXES.some((prefix) => file.startsWith(prefix));
}
