import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export async function writeAgentContext(cwd: string, context: AgentContext): Promise<void> {
  const path = resolve(cwd, "agent-context.json");
  const content = `${JSON.stringify(context, null, 2)}\n`;
  await writeFile(path, content.replace(/\r\n/g, "\n"), "utf-8");
}
