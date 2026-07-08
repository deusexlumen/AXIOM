import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AgentContext } from "@/cli/schemas/agent-context.js";

export async function readAgentContext(cwd: string): Promise<AgentContext> {
  const path = resolve(cwd, "agent-context.json");
  const raw = await readFile(path, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return AgentContext.parse(parsed);
}
