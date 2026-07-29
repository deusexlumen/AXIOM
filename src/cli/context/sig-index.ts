import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { hashString } from "@/cli/manifest/hash.js";
import { deterministicStringify } from "@/cli/commands/plan-helpers.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export interface SigIndex {
  hash: string;
  signatures: Record<string, string[]>;
}

const SIG_INDEX_FILE = ".axiom/sig-index.json";

export async function readSigIndex(cwd: string): Promise<SigIndex | null> {
  try {
    return JSON.parse(await readFile(resolve(cwd, SIG_INDEX_FILE), "utf-8")) as SigIndex;
  } catch {
    return null;
  }
}

export async function writeSigIndex(cwd: string, index: SigIndex): Promise<void> {
  await mkdir(resolve(cwd, ".axiom"), { recursive: true });
  await writeFile(resolve(cwd, SIG_INDEX_FILE), deterministicStringify(index), "utf-8");
}

export async function buildSigIndex(cwd: string, context: AgentContext): Promise<SigIndex> {
  const signatures: Record<string, string[]> = {};
  const files = [
    ...context.components.map((c) => c.file),
    ...context.routes.map((r) => r.file),
    ...context.stores.map((s) => s.file),
  ];
  for (const file of files.sort()) {
    signatures[file] = await extractSignatures(resolve(cwd, file));
  }
  const payload = deterministicStringify({ signatures });
  return { hash: hashString(payload), signatures };
}

async function extractSignatures(path: string): Promise<string[]> {
  let content: string;
  try {
    content = await readFile(path, "utf-8");
  } catch {
    return [];
  }
  const names = new Set<string>();
  const decl = /^export\s+(?:const|function|class|interface|type|enum)\s+([A-Za-z0-9_]+)/gmu;
  for (const m of content.matchAll(decl)) if (m[1]) names.add(m[1]);
  const named = /export\s*\{([^}]+)\}/g;
  for (const m of content.matchAll(named)) {
    for (const part of m[1]!.split(",")) {
      const alias = part.trim().split(/\s+as\s+/u)[0];
      if (alias) names.add(alias.trim());
    }
  }
  return Array.from(names).sort();
}
