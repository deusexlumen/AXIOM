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

export async function checkPins(cwd: string): Promise<VisualPins> {
  const pkgPath = resolve(cwd, "package.json");
  const cssPath = resolve(cwd, "src/core/styles.css");
  const lockPath = resolve(cwd, "pnpm-lock.yaml");
  const fontPath = resolve(cwd, VISUAL_CONFIG.fontPath);

  let chromiumLocked = false;
  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
      devDependencies?: Record<string, string>;
    };
    chromiumLocked = isExactVersion(pkg.devDependencies?.["@playwright/test"]);
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
