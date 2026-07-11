import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ndjson } from "@/cli/utils/ndjson.js";

export async function installDependency(
  cwd: string,
  name: string,
  version: string,
  noPnpm: boolean,
  out?: NodeJS.WritableStream
): Promise<boolean> {
  if (!noPnpm) {
    try {
      execFileSync("pnpm", ["add", "--save-exact", `${name}@${version}`], { cwd, stdio: "ignore" });
      return true;
    } catch (error) {
      if (isEnoent(error)) {
        emitFallbackWarning(out, "pnpm not found; falling back to package.json edit");
        return editPackageJsonFallback(cwd, name, version, out);
      }
      throw error;
    }
  }
  return editPackageJsonFallback(cwd, name, version, out);
}

async function editPackageJsonFallback(
  cwd: string,
  name: string,
  version: string,
  out?: NodeJS.WritableStream
): Promise<boolean> {
  const path = resolve(cwd, "package.json");
  const pkg = JSON.parse(await readFile(path, "utf-8")) as Record<string, unknown>;
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  deps[name] = version;
  pkg.dependencies = deps;
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  return regenerateLockfile(cwd, out);
}

async function regenerateLockfile(cwd: string, out?: NodeJS.WritableStream): Promise<boolean> {
  try {
    execFileSync("pnpm", ["install", "--lockfile-only", "--prefer-offline", "--ignore-scripts"], {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    if (isEnoent(error)) {
      emitFallbackWarning(out, "pnpm not found; skipping lockfile hash update");
      return false;
    }
    throw error;
  }
}

function isEnoent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ENOENT";
}

function emitFallbackWarning(out: NodeJS.WritableStream | undefined, message: string): void {
  if (out) ndjson({ type: "log", message }, out);
}
