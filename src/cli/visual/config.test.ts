import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPins, VISUAL_CONFIG } from "@/cli/visual/config.js";

function lockfileWith(specifier: string): string {
  return `lockfileVersion: '9.0'
importers:
  .:
    dependencies:
      '@playwright/test':
        specifier: ${specifier}
        version: 1.61.1
`;
}

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

  it("detects exact Playwright version in dependencies", async () => {
    writeFileSync(
      join(baseDir, "package.json"),
      JSON.stringify({ dependencies: { "@playwright/test": "1.61.1" } })
    );
    writeFileSync(join(baseDir, VISUAL_CONFIG.fontPath), "font");
    writeFileSync(join(baseDir, "pnpm-lock.yaml"), lockfileWith("1.61.1"));
    writeFileSync(join(baseDir, "src/core/styles.css"), "@media (prefers-reduced-motion: reduce) { * { animation: none; } }");

    const pins = await checkPins(baseDir);
    expect(pins).toEqual({
      chromiumLocked: true,
      viewportLocked: true,
      fontPinned: true,
      animationsDisabled: true,
    });
  });

  it("detects exact Playwright version in devDependencies", async () => {
    writeFileSync(
      join(baseDir, "package.json"),
      JSON.stringify({ devDependencies: { "@playwright/test": "1.61.1" } })
    );
    writeFileSync(join(baseDir, "pnpm-lock.yaml"), lockfileWith("1.61.1"));

    const pins = await checkPins(baseDir);
    expect(pins.chromiumLocked).toBe(true);
  });

  it("rejects non-exact package.json versions", async () => {
    writeFileSync(
      join(baseDir, "package.json"),
      JSON.stringify({ devDependencies: { "@playwright/test": "^1.61.1" } })
    );
    writeFileSync(join(baseDir, "pnpm-lock.yaml"), lockfileWith("1.61.1"));
    const pins = await checkPins(baseDir);
    expect(pins.chromiumLocked).toBe(false);
  });

  it("rejects non-exact lockfile specifiers", async () => {
    writeFileSync(
      join(baseDir, "package.json"),
      JSON.stringify({ devDependencies: { "@playwright/test": "1.61.1" } })
    );
    writeFileSync(join(baseDir, "pnpm-lock.yaml"), lockfileWith("^1.61.1"));
    const pins = await checkPins(baseDir);
    expect(pins.chromiumLocked).toBe(false);
  });
});
