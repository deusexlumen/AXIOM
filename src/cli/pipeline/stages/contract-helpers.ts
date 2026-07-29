import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, basename } from "node:path";

const SOURCE_EXT = /\.(ts|tsx)$/;

async function listTsFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsFiles(full)));
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

export async function findRawFetch(cwd: string, dirs: string[]): Promise<string | undefined> {
  for (const dir of dirs) {
    const files = await listTsFiles(resolve(cwd, dir));
    for (const file of files) {
      const content = await readFile(file, "utf-8").catch(() => "");
      if (/\bfetch\s*\(/.test(content)) {
        return relative(cwd, file).replace(/\\/g, "/");
      }
    }
  }
  return undefined;
}

export function handlerRouteName(handlerPath: string, contractName: string): string | undefined {
  const base = basename(handlerPath);
  const match = new RegExp(`^${contractName}\\.(.+)\\.ts$`).exec(base);
  return match ? `${contractName}.${match[1]}` : undefined;
}

export function handlerUsesType(content: string, routeName: string): boolean {
  const importRe = /import\s+(?:type\s+)?\{\s*HandlerFor\s*\}[^}]+from\s+["']@\/api\/generated\/handler-types["']/;
  const typeRe = new RegExp(`HandlerFor\\s*<\\s*["'\`]${routeName}["'\`]\\s*>`);
  return importRe.test(content) && typeRe.test(content);
}
