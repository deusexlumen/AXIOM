import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPins, VISUAL_CONFIG } from "@/cli/visual/config.js";

describe("checkPins", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-visual-config-test-"));
    mkdirSync(join(baseDir, "src/core/fonts"), { recursive: true });
    mkdirSync(join(baseDir, "src/core"), { recursive: true });
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("reports all pins false in an empty project", async () => {
    const pins = await checkPins(baseDir);
    expect(pins).toEqual({
      chromiumLocked: false,
      viewportLocked: false,
      fontPinned: false,
      animationsDisabled: false,
    });
  });

  it("detects exact Playwright version, font, lockfile and reduced motion", async () => {
    writeFileSync(
      join(baseDir, "package.json"),
      JSON.stringify({ devDependencies: { "@playwright/test": "1.49.1" } })
    );
    writeFileSync(join(baseDir, VISUAL_CONFIG.fontPath), "font");
    writeFileSync(join(baseDir, "pnpm-lock.yaml"), "lockfile");
    writeFileSync(join(baseDir, "src/core/styles.css"), "@media (prefers-reduced-motion: reduce) { * { animation: none; } }");

    const pins = await checkPins(baseDir);
    expect(pins).toEqual({
      chromiumLocked: true,
      viewportLocked: true,
      fontPinned: true,
      animationsDisabled: true,
    });
  });

  it("rejects non-exact Playwright versions", async () => {
    writeFileSync(
      join(baseDir, "package.json"),
      JSON.stringify({ devDependencies: { "@playwright/test": "^1.49.1" } })
    );
    const pins = await checkPins(baseDir);
    expect(pins.chromiumLocked).toBe(false);
  });
});
