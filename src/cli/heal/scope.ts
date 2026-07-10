import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function isPathAllowed(file: string, context: AgentContext): boolean {
  if (file.startsWith(".github/")) return false;
  if (file.startsWith("/") || file.includes("..")) return false;
  const locked = new Set(Object.keys(context.integrity.lockedFiles));
  const machine = new Set(Object.keys(context.integrity.machineFiles));
  if (locked.has(file) || machine.has(file)) return false;
  if (
    file.startsWith("src/core/") ||
    file.startsWith("src/generated/") ||
    file.startsWith("src/routes/") ||
    file.startsWith("api/generated/")
  ) {
    return false;
  }
  if (file === "tokens.json") return false;
  return true;
}
