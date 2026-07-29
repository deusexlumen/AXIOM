import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const VISUAL_CONFIG = {
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  fontPath: "src/core/fonts/Inter-Regular.woff2",
  chromiumChannel: "chromium",
  diffThreshold: 0.001,
};

export interface VisualPins {
  chromiumLocked: boolean;
  viewportLocked: boolean;
  fontPinned: boolean;
  animationsDisabled: boolean;
}

async function exists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

function isExactVersion(version: unknown): boolean {
  return typeof version === "string" && /^\d+\.\d+\.\d+$/.test(version);
}

function getPkgVersion(pkg: Record<string, unknown>): string | undefined {
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
  return deps["@playwright/test"] ?? devDeps["@playwright/test"];
}

function findLockedSpecifier(lockContent: string): string | undefined {
  const lines = lockContent.split("\n");
  let inRoot = false;
  let inDeps = false;
  let target: string | undefined;

  for (const line of lines) {
    if (line.startsWith("  .:")) {
      inRoot = true;
      inDeps = false;
      target = undefined;
      continue;
    }
    if (!inRoot) continue;

    if (line.startsWith("    dependencies:") || line.startsWith("    devDependencies:")) {
      inDeps = true;
      target = undefined;
      continue;
    }

    if (line.startsWith("  ") && !line.startsWith("    ")) {
      inRoot = false;
      inDeps = false;
      target = undefined;
      continue;
    }

    if (inDeps && line.startsWith("      '@playwright/test':")) {
      target = "@playwright/test";
      continue;
    }

    if (target && line.startsWith("        specifier:")) {
      return line.slice(line.indexOf(":") + 1).trim();
    }
  }

  return undefined;
}

export async function checkPins(cwd: string): Promise<VisualPins> {
  const pkgPath = resolve(cwd, "package.json");
  const cssPath = resolve(cwd, "src/core/styles.css");
  const lockPath = resolve(cwd, "pnpm-lock.yaml");
  const fontPath = resolve(cwd, VISUAL_CONFIG.fontPath);

  let chromiumLocked = false;
  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as Record<string, unknown>;
    const lockContent = await readFile(lockPath, "utf-8");
    const pkgExact = isExactVersion(getPkgVersion(pkg));
    const lockExact = isExactVersion(findLockedSpecifier(lockContent));
    chromiumLocked = pkgExact && lockExact;
  } catch {
    chromiumLocked = false;
  }

  let animationsDisabled = false;
  try {
    const css = await readFile(cssPath, "utf-8");
    animationsDisabled =
      css.includes("prefers-reduced-motion") ||
      css.includes("animation: none") ||
      css.includes("transition: none");
  } catch {
    animationsDisabled = false;
  }

  return {
    chromiumLocked,
    viewportLocked: await exists(lockPath),
    fontPinned: await exists(fontPath),
    animationsDisabled,
  };
}
