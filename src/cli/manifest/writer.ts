import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function serializeAgentContext(context: AgentContext): string {
  return `${JSON.stringify(context, null, 2)}\n`.replace(/\r\n/g, "\n");
}

export async function writeAgentContext(cwd: string, context: AgentContext): Promise<void> {
  const path = resolve(cwd, "agent-context.json");
  await writeFile(path, serializeAgentContext(context), "utf-8");
}
