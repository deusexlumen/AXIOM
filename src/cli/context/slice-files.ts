import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

type C = AgentContext["components"][number];
type E = C | AgentContext["routes"][number] | AgentContext["stores"][number];
export type SliceFile = { path: string; content: string };

export function findEntry(ctx: AgentContext, file: string): E | undefined {
  return ctx.components.find((c) => c.file === file) ?? ctx.routes.find((r) => r.file === file) ?? ctx.stores.find((s) => s.file === file);
}

export function findComponent(ctx: AgentContext, name: string): C | undefined {
  return ctx.components.find((c) => c.name === name);
}

export async function pushFile(files: SliceFile[], cwd: string, path: string): Promise<void> {
  files.push({ path, content: await readFile(resolve(cwd, path), "utf-8") });
}

export async function pushComponent(files: SliceFile[], cwd: string, comp: C): Promise<void> {
  await pushFile(files, cwd, comp.file);
  await pushFile(files, cwd, comp.spec);
}
