import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Writable } from "node:stream";
import { tokensBuild } from "@/cli/commands/tokens-build.js";

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

  it("reports both generated files in CLI output", async () => {
    const { stream, lines } = captureStream();
    await tokensBuild(baseDir, stream);

    expect(lines).toHaveLength(1);
    const result = lines[0] as { type: string; ok: boolean; data: { files: string[] } };
    expect(result.type).toBe("result");
    expect(result.ok).toBe(true);
    expect(result.data.files).toContain("src/generated/theme.css");
    expect(result.data.files).toContain("src/generated/motion.ts");
  });
});
