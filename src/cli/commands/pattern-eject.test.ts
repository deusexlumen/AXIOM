import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";
import { addPattern } from "@/cli/commands/pattern-add.js";
import { ejectPattern } from "@/cli/commands/pattern-eject.js";
import { readAgentContext } from "@/cli/manifest/reader.js";

const baseDir = mkdtempSync(join(tmpdir(), "axiom-pattern-eject-"));

beforeAll(async () => {
  await init("eject", { cwd: baseDir, skipInstall: true });
}, 300000);

afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

describe("ejectPattern", () => {
  it("ejects a webgl pattern into the agent zone", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "eject");
    await addPattern("distortion-media", { cwd });

    await ejectPattern("distortion-media", { cwd });

    expect(existsSync(join(cwd, "src/patterns/distortion-media"))).toBe(false);
    expect(existsSync(join(cwd, "src/components/DistortionMedia.tsx"))).toBe(true);
    expect(existsSync(join(cwd, "src/components/DistortionMedia.spec.json"))).toBe(true);
    expect(existsSync(join(cwd, "src/components/DistortionMedia.frag.glsl"))).toBe(true);

    const tsx = readFileSync(join(cwd, "src/components/DistortionMedia.tsx"), "utf-8");
    expect(tsx).toContain("export function DistortionMedia");
    expect(tsx).toContain("./DistortionMedia.frag.glsl");

    const ctx = await readAgentContext(cwd);
    expect(ctx.patterns?.some((p) => p.name === "distortion-media")).toBe(false);
    const component = ctx.components.find((c) => c.name === "DistortionMedia");
    expect(component).toBeDefined();
    expect(component?.file).toBe("src/components/DistortionMedia.tsx");
    expect(component?.spec).toBe("src/components/DistortionMedia.spec.json");
  });

  it("ejects a nav pattern without a shader", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "eject");
    await addPattern("magnetic-cta", { cwd });

    await ejectPattern("magnetic-cta", { cwd });

    expect(existsSync(join(cwd, "src/components/MagneticCta.tsx"))).toBe(true);
    expect(existsSync(join(cwd, "src/components/MagneticCta.spec.json"))).toBe(true);
    expect(existsSync(join(cwd, "src/components/MagneticCta.frag.glsl"))).toBe(false);

    const ctx = await readAgentContext(cwd);
    expect(ctx.patterns?.some((p) => p.name === "magnetic-cta")).toBe(false);
    expect(ctx.components.some((c) => c.name === "MagneticCta")).toBe(true);
  });
});
