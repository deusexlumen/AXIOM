import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";
import { addPattern } from "@/cli/commands/pattern-add.js";
import { readAgentContext } from "@/cli/manifest/reader.js";

const baseDir = mkdtempSync(join(tmpdir(), "axiom-pattern-add-"));

beforeAll(async () => {
  for (const name of ["webgl", "scroll", "typo", "params", "wave1", "wave2"]) {
    await init(name, { cwd: baseDir, skipInstall: true });
  }
}, 300000);

afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

describe("addPattern", () => {
  it("creates a webgl pattern with shader", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "webgl");
    await addPattern("distortion-media", { cwd });

    const patternJson = readFileSync(join(cwd, "src/patterns/distortion-media/pattern.json"), "utf-8");
    const index = readFileSync(join(cwd, "src/patterns/distortion-media/index.tsx"), "utf-8");
    const fixture = readFileSync(join(cwd, "src/patterns/distortion-media/fixture.tsx"), "utf-8");
    const shader = readFileSync(join(cwd, "src/patterns/distortion-media/shader.frag.glsl"), "utf-8");

    expect(JSON.parse(patternJson).category).toBe("webgl");
    expect(index).toContain("export function DistortionMedia");
    expect(index).toContain("@/core/Stage");
    expect(fixture).toContain("export default function DistortionMediaFixture");
    expect(shader).toContain("uIntensity");

    const ctx = await readAgentContext(cwd);
    const entry = ctx.patterns?.find((p) => p.name === "distortion-media");
    expect(entry).toBeDefined();
    expect(entry?.category).toBe("webgl");
    expect(entry?.shader).toBe("src/patterns/distortion-media/shader.frag.glsl");
  });

  it("creates a scroll pattern", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "scroll");
    await addPattern("pinned-narrative", { cwd });

    const index = readFileSync(join(cwd, "src/patterns/pinned-narrative/index.tsx"), "utf-8");
    expect(index).toContain("export function PinnedNarrative");
    expect(index).toContain("@/core/useChoreo");
    expect(index).toContain("pin: true");
  });

  it("creates a typo pattern", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "typo");
    await addPattern("split-reveal", { cwd });

    const index = readFileSync(join(cwd, "src/patterns/split-reveal/index.tsx"), "utf-8");
    expect(index).toContain("export function SplitReveal");
    expect(index).toContain("@/generated/motion");
  });

  it("merges custom params into pattern.json", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "params");
    await addPattern("distortion-media", { cwd, params: JSON.stringify({ intensity: 0.9 }) });

    const patternJson = readFileSync(join(cwd, "src/patterns/distortion-media/pattern.json"), "utf-8");
    expect(JSON.parse(patternJson).params.intensity.default).toBe(0.9);
  });

  it("adds all 9 wave-1 patterns", { timeout: 300000 }, async () => {
    const cwd = join(baseDir, "wave1");
    const names = [
      "distortion-media",
      "flowmap-hero",
      "particle-type",
      "pinned-narrative",
      "horizontal-drift",
      "parallax-stack",
      "split-reveal",
      "weight-breathe",
      "marquee-velocity",
    ];

    for (const name of names) {
      await addPattern(name, { cwd });
    }

    const ctx = await readAgentContext(cwd);
    for (const name of names) {
      const entry = ctx.patterns?.find((p) => p.name === name);
      expect(entry).toBeDefined();
      expect(existsSync(join(cwd, entry!.patternJson))).toBe(true);
      expect(existsSync(join(cwd, entry!.file))).toBe(true);
      expect(existsSync(join(cwd, entry!.fixture))).toBe(true);
      if (entry!.category === "webgl") {
        expect(entry!.shader).toBeDefined();
        expect(existsSync(join(cwd, entry!.shader ?? ""))).toBe(true);
      }
    }
  });

  it("adds all 9 wave-2 patterns", { timeout: 300000 }, async () => {
    const cwd = join(baseDir, "wave2");
    const names = [
      "mesh-gradient-bg",
      "dither-shader",
      "depth-gallery",
      "sequence-scrub",
      "page-mask-transition",
      "webgl-crossfade",
      "magnetic-cta",
      "cursor-system",
      "preloader-counter",
    ];

    for (const name of names) {
      await addPattern(name, { cwd });
    }

    const ctx = await readAgentContext(cwd);
    for (const name of names) {
      const entry = ctx.patterns?.find((p) => p.name === name);
      expect(entry).toBeDefined();
      expect(existsSync(join(cwd, entry!.patternJson))).toBe(true);
      expect(existsSync(join(cwd, entry!.file))).toBe(true);
      expect(existsSync(join(cwd, entry!.fixture))).toBe(true);
      if (entry!.category === "webgl" || entry!.name === "webgl-crossfade") {
        expect(entry!.shader).toBeDefined();
        expect(existsSync(join(cwd, entry!.shader ?? ""))).toBe(true);
      }
    }
  });
});
