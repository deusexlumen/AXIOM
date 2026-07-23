import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { VISUAL_CONFIG } from "@/cli/visual/config.js";

function resolveOdiffPath(): string {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("odiff-bin/package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { bin?: Record<string, string> };
  return resolve(pkgPath, "..", pkg.bin?.odiff ?? "odiff");
}

function resolveRoute(route: string): string {
  return route.startsWith("http") ? route : `http://localhost:3000${route.startsWith("/") ? "" : "/"}${route}`;
}

export async function captureGoldenScreenshot(cwd: string, route: string, outPath: string): Promise<void> {
  const url = resolveRoute(route);
  const browser = await chromium.launch({ channel: VISUAL_CONFIG.chromiumChannel as "chromium" });
  const context = await browser.newContext({
    viewport: VISUAL_CONFIG.viewport,
    deviceScaleFactor: VISUAL_CONFIG.deviceScaleFactor,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate("document.fonts.ready");
  await page.screenshot({ path: resolve(cwd, outPath), type: "png" });
  await browser.close();
}

export interface CompareResult {
  matches: boolean;
  ratio?: number;
}

export function compareGoldenScreenshots(pathA: string, pathB: string): CompareResult {
  if (!existsSync(pathA) || !existsSync(pathB)) {
    return { matches: false, ratio: 1 };
  }
  try {
    const stdout = execSync(
      `"${resolveOdiffPath()}" "${pathA}" "${pathB}" --parsable-stdout`,
      { encoding: "utf-8", stdio: "pipe" }
    );
    const ratio = parseDiffRatio(stdout);
    return { matches: ratio <= VISUAL_CONFIG.diffThreshold, ratio };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "");
    const ratio = parseDiffRatio(stdout);
    return { matches: ratio <= VISUAL_CONFIG.diffThreshold, ratio };
  }
}

function parseDiffRatio(output: string): number {
  const trimmed = output.trim();
  if (!trimmed.includes(";")) return 0;
  const percent = trimmed.split(";")[1];
  return Number(percent) / 100;
}
