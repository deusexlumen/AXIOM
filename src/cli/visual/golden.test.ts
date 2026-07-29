import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { tokensBuild } from "@/cli/commands/tokens-build.js";

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

const motionFixture = {
  ease: { hero: { curve: [0.16, 1, 0.3, 1], meaning: "" }, snap: { curve: [0.83, 0, 0.17, 1], meaning: "" } },
  dur: { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 },
  stagger: { chars: 0.018, lines: 0.08, items: 0.12 },
  scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
  transitions: {},
  choreography: { revealOrder: [], maxConcurrentTimelines: 3 },
  reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
};

const tokensFixture = { color: { primary: "#000000", surface: { base: "#ffffff" } } };

function baseDirection(id: string, color: string, density: number): unknown {
  return {
    directionId: id,
    thesis: id,
    typography: { display: { family: "InterVariable" }, text: { family: "InterVariable" }, scaleRatio: 1.333 },
    color: { story: id, tokensDraft: { "accent-primary": color } },
    space: { language: "airy", density, gridBias: "asymmetric" },
    motionPersonality: { adjectives: [id], tempo: "mid", playfulness: 0.5 },
    texture: { grain: 0, noiseShader: false },
    webglLevel: 0,
    sceneIdeas: [id],
  };
}

function byteDifference(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  let diff = 0;
  for (let i = 0; i < maxLen; i += 1) {
    if (a[i] !== b[i]) diff += 1;
  }
  return diff / maxLen;
}

describe("golden preset differentiation", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-golden-test-"));
    mkdirSync(resolve(baseDir, "src", "generated"), { recursive: true });
    writeJson(resolve(baseDir, "tokens.json"), tokensFixture);
    writeJson(resolve(baseDir, "MOTION.axm.json"), motionFixture);
    writeJson(resolve(baseDir, "agent-context.json"), {
      axiomVersion: "1.0.0",
      project: { name: "test", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
      components: [],
      routes: [],
      stores: [],
      patterns: [],
      tokens: { file: "tokens.json", hash: "sha256:initial" },
      integrity: { lockedFiles: {}, machineFiles: {} },
      pipeline: { lastRun: null },
    });
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("produces visibly different theme.css under two direction presets", async () => {
    writeJson(resolve(baseDir, "DIRECTION.axm.json"), baseDirection("dir_warm", "#e85d04", 0.3));
    await tokensBuild(baseDir);
    const cssA = readFileSync(resolve(baseDir, "src", "generated", "theme.css"), "utf-8");

    writeJson(resolve(baseDir, "DIRECTION.axm.json"), baseDirection("dir_cool", "#0488e8", 0.7));
    await tokensBuild(baseDir);
    const cssB = readFileSync(resolve(baseDir, "src", "generated", "theme.css"), "utf-8");

    expect(cssA).not.toBe(cssB);
    expect(byteDifference(cssA, cssB)).toBeGreaterThan(0.3);
    expect(cssA).toContain("#e85d04");
    expect(cssB).toContain("#0488e8");
  });
});
