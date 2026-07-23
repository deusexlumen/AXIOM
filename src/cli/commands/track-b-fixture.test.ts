import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BriefJson } from "@/cli/schemas/brief.js";
import { DirectionJson } from "@/cli/schemas/direction.js";
import { MotionJson } from "@/cli/schemas/motion.js";

const base = resolve(import.meta.dirname, "../fixtures/track-b-portfolio");

describe("track-b-portfolio fixture", () => {
  it("has a valid brief", () => {
    const raw = JSON.parse(readFileSync(resolve(base, "BRIEF.axm.json"), "utf-8")) as unknown;
    const result = BriefJson.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.track).toBe("bespoke");
  });

  it("has a valid direction", () => {
    const raw = JSON.parse(readFileSync(resolve(base, "DIRECTION.axm.json"), "utf-8")) as unknown;
    const result = DirectionJson.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it("has a valid motion grammar", () => {
    const raw = JSON.parse(readFileSync(resolve(base, "MOTION.axm.json"), "utf-8")) as unknown;
    const result = MotionJson.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it("uses custom easings, not only defaults", () => {
    const raw = JSON.parse(readFileSync(resolve(base, "MOTION.axm.json"), "utf-8")) as Record<string, unknown>;
    const ease = raw.ease as Record<string, { curve: number[] }>;
    const keys = Object.keys(ease);
    const hasCustom = keys.some((k) => !["power1", "power2", "power3", "power4", "none", "linear"].includes(k));
    expect(hasCustom).toBe(true);
  });

  it("has a portfolio page", () => {
    const page = readFileSync(resolve(base, "app/page.tsx"), "utf-8");
    expect(page).toContain("data-axm-id=\"portfolio\"");
    expect(page).toContain("@/patterns/flowmap-hero");
    expect(page).toContain("@/patterns/depth-gallery");
  });
});
