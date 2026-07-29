import { readAgentContext } from "@/cli/manifest/reader.js";
import { serializeAgentContext, writeAgentContext } from "@/cli/manifest/writer.js";
import { hashString } from "@/cli/manifest/hash.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export async function readContext(cwd: string): Promise<AgentContext> {
  return readAgentContext(cwd);
}

export async function writeContext(cwd: string, context: AgentContext): Promise<void> {
  const copy = JSON.parse(JSON.stringify(context)) as AgentContext;
  delete copy.integrity.machineFiles["agent-context.json"];
  const selfHash = hashString(serializeAgentContext(copy));
  context.integrity.machineFiles["agent-context.json"] = selfHash;
  await writeAgentContext(cwd, context);
}
