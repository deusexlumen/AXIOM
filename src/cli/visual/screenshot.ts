import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { VISUAL_CONFIG } from "@/cli/visual/config.js";
import { ExitCode } from "@/cli/types.js";

async function injectFont(page: import("@playwright/test").Page, cwd: string): Promise<void> {
  const fontData = await readFile(resolve(cwd, VISUAL_CONFIG.fontPath));
  const css = `
    @font-face {
      font-family: 'Inter';
      src: url('data:font/woff2;base64,${fontData.toString("base64")}') format('woff2');
      font-display: block;
    }
    * { font-family: 'Inter', sans-serif; }
  `;
  await page.addStyleTag({ content: css });
}

export async function captureScreenshot(
  cwd: string,
  component: string,
  outPath: string,
  routeUrl: string
): Promise<void> {
  if (!routeUrl.trim()) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "routeUrl is required for visual screenshots", [])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const browser = await chromium.launch({
    channel: VISUAL_CONFIG.chromiumChannel as "chromium",
  });
  const context = await browser.newContext({
    viewport: VISUAL_CONFIG.viewport,
    deviceScaleFactor: VISUAL_CONFIG.deviceScaleFactor,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  await page.goto(routeUrl);
  await injectFont(page, cwd);
  await page.evaluate("document.fonts.ready");

  await page.screenshot({ path: outPath, type: "png" });
  await browser.close();
}
