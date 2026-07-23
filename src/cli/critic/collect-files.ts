import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export interface ProjectFiles {
  tokens: string;
  themeCss: string;
  motion: string;
  tsxSources: Record<string, string>;
  cssSources: Record<string, string>;
}

async function readOptional(path: string): Promise<string> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return "";
  }
}

async function collectByExt(cwd: string, dir: string, exts: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const root = resolve(cwd, dir);
  const queue: string[] = [];
  try {
    if ((await stat(root)).isDirectory()) queue.push(root);
  } catch {
    return out;
  }
  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(full);
        continue;
      }
      if (exts.some((ext) => entry.name.endsWith(ext))) {
        const rel = full.slice(cwd.length + 1);
        out[rel] = await readFile(full, "utf-8");
      }
    }
  }
  return out;
}

export async function collectProjectFiles(cwd: string): Promise<ProjectFiles> {
  const tsxSources: Record<string, string> = {};
  for (const dir of ["app", "src/components", "src/routes"]) {
    Object.assign(tsxSources, await collectByExt(cwd, dir, [".tsx", ".ts", ".jsx"]));
  }
  const cssSources: Record<string, string> = {};
  Object.assign(cssSources, await collectByExt(cwd, "src/generated", [".css"]));
  Object.assign(cssSources, await collectByExt(cwd, "app", [".css"]));
  return {
    tokens: await readOptional(resolve(cwd, "tokens.json")),
    themeCss: await readOptional(resolve(cwd, "src/generated/theme.css")),
    motion: await readOptional(resolve(cwd, "MOTION.axm.json")),
    tsxSources,
    cssSources,
  };
}
