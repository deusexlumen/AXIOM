import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Writable } from "node:stream";
import { tokensBuild, motionBuild } from "@/cli/commands/tokens-build.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

function captureStream(): { stream: NodeJS.WritableStream; lines: unknown[] } {
  const lines: unknown[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      const text = chunk.toString();
      for (const line of text.split("\n")) {
        if (line.trim() !== "") {
          lines.push(JSON.parse(line));
        }
      }
      callback();
    },
  });
  return { stream, lines };
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

const motionFixture = {
  ease: {
    hero: { curve: [0.16, 1, 0.3, 1], meaning: "große Enthüllungen" },
    snap: { curve: [0.83, 0, 0.17, 1], meaning: "UI-Feedback" },
  },
  dur: { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 },
  stagger: { chars: 0.018, lines: 0.08, items: 0.12 },
  scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
  transitions: {
    pageEnter: { grammar: "mask-wipe-up", dur: "scene", ease: "hero" },
    pageExit: { grammar: "fade-scale-098", dur: "ui", ease: "snap" },
  },
  choreography: { revealOrder: ["display-text", "media"], maxConcurrentTimelines: 3 },
  reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
};

const tokensFixture = {
  color: { primary: "#000000", surface: { base: "#ffffff" } },
};

describe("tokensBuild", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-tokens-build-test-"));
    mkdirSync(resolve(baseDir, "src", "generated"), { recursive: true });
    writeJson(resolve(baseDir, "tokens.json"), tokensFixture);
    writeJson(resolve(baseDir, "MOTION.axm.json"), motionFixture);
    writeJson(resolve(baseDir, "agent-context.json"), {
      axiomVersion: "1.0.0",
      project: { name: "test", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
      components: [],
      routes: [],
      stores: [],
      tokens: { file: "tokens.json", hash: "sha256:initial" },
      integrity: { lockedFiles: {}, machineFiles: {} },
      pipeline: { lastRun: null },
    });
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("writes theme.css and motion.ts and updates manifest hashes", async () => {
    await tokensBuild(baseDir, noopStream());

    expect(existsSync(resolve(baseDir, "src", "generated", "theme.css"))).toBe(true);
    expect(existsSync(resolve(baseDir, "src", "generated", "motion.ts"))).toBe(true);

    const motionTs = readFileSync(resolve(baseDir, "src", "generated", "motion.ts"), "utf-8");
    expect(motionTs).toContain("export const motion = {");
    expect(motionTs).toContain("pageEnter: { grammar: \"mask-wipe-up\", dur: 1.6, ease: [0.16, 1, 0.3, 1] as const }");

    const context = JSON.parse(readFileSync(resolve(baseDir, "agent-context.json"), "utf-8"));
    expect(context.integrity.machineFiles["src/generated/theme.css"]).toMatch(/^sha256:/);
    expect(context.integrity.machineFiles["src/generated/motion.ts"]).toMatch(/^sha256:/);
  });

  it("reports generated files in CLI output", async () => {
    const { stream, lines } = captureStream();
    await tokensBuild(baseDir, stream);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ type: "result", ok: true });
    expect((lines[0] as { data: { files: string[] } }).data.files).toContain("src/generated/motion.ts");
    expect(lines[1]).toMatchObject({ type: "result", ok: true });
    expect((lines[1] as { data: { files: string[] } }).data.files).toContain("src/generated/theme.css");
    expect((lines[1] as { data: { files: string[] } }).data.files).toContain("src/generated/motion.ts");
  });

  it("injects fluid typography tokens when DIRECTION.axm.json exists", async () => {
    writeJson(resolve(baseDir, "DIRECTION.axm.json"), {
      directionId: "dir_test",
      thesis: "Test",
      typography: {
        display: { family: "FrauncesVariable", axis: { wght: [200, 900] } },
        text: { family: "InterVariable" },
        scaleRatio: 1.333,
      },
      color: { story: "Test", tokensDraft: {} },
      space: { language: "airy", density: 0.3, gridBias: "asymmetric" },
      motionPersonality: { adjectives: ["calm"], tempo: "mid", playfulness: 0.5 },
      texture: { grain: 0, noiseShader: false },
      webglLevel: 0,
      sceneIdeas: ["Test"],
    });

    await tokensBuild(baseDir, noopStream());

    const css = readFileSync(resolve(baseDir, "src", "generated", "theme.css"), "utf-8");
    expect(css).toContain("--font-size-base:");
    expect(css).toContain("--font-family-display:");
    expect(css).toContain("clamp(");
  });

  it("motionBuild generates only motion.ts", async () => {
    const { stream, lines } = captureStream();
    await motionBuild(baseDir, stream);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ type: "result", ok: true });
    expect((lines[0] as { data: { files: string[] } }).data.files).toEqual(["src/generated/motion.ts"]);
  });
});
