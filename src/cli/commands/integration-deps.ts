import { cpSync, existsSync, mkdirSync, readdirSync, readlinkSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";

const PARENT_NODE_MODULES = resolve(process.cwd(), "node_modules");

function copyDirOrSymlink(src: string, dest: string): void {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirOrSymlink(s, d);
    } else if (entry.isSymbolicLink()) {
      const target = readlinkSync(s);
      try {
        cpSync(resolve(src, target), d, { recursive: true, force: true });
      } catch {
        // ignore broken symlinks
      }
    } else {
      cpSync(s, d, { force: true });
    }
  }
}

export function installPackage(cwd: string, name: string): void {
  const src = join(PARENT_NODE_MODULES, name);
  if (!existsSync(src)) throw new Error(`Missing parent dependency: ${name}`);
  const target = join(cwd, "node_modules", name);
  mkdirSync(target, { recursive: true });
  copyDirOrSymlink(src, target);
}

export function installAppDeps(cwd: string): void {
  execSync("pnpm install --ignore-scripts --prefer-offline", {
    cwd,
    stdio: "ignore",
    timeout: 180000,
    windowsHide: true,
  });
}
