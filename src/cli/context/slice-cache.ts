import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { hashFile } from "@/cli/manifest/hash.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export interface CachedSlice {
  key: string;
  target: string;
  tokenCount: number;
  files: Array<{ path: string; content: string }>;
  createdAt: string;
}

const CACHE_DIR = ".axiom/slice-cache";

function cachePath(cwd: string, key: string): string {
  return resolve(cwd, CACHE_DIR, `${key}.ndjson`);
}

export async function readCachedSlice(cwd: string, key: string): Promise<CachedSlice | null> {
  try {
    const raw = await readFile(cachePath(cwd, key), "utf-8");
    const lines = raw.trim().split("\n");
    return JSON.parse(lines[lines.length - 1]!) as CachedSlice;
  } catch {
    return null;
  }
}

export async function writeCachedSlice(cwd: string, slice: CachedSlice): Promise<void> {
  await mkdir(resolve(cwd, CACHE_DIR), { recursive: true });
  await writeFile(cachePath(cwd, slice.key), `${JSON.stringify(slice)}\n`, "utf-8");
}

export async function computeSliceCacheKey(cwd: string, target: string, context: AgentContext): Promise<string> {
  const targetHash = await hashFile(resolve(cwd, target)).catch(() => "missing");
  const graph = JSON.stringify(
    context.components.map((c) => ({ name: c.name, dependsOn: c.dependsOn, usedBy: c.usedBy }))
  );
  const graphHash = createHash("sha256").update(graph).digest("hex");
  return createHash("sha256").update(`${target}:${targetHash}:${graphHash}`).digest("hex");
}
