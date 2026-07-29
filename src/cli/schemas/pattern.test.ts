import { describe, it, expect } from "vitest";
import { PatternJson, PatternCategory, PatternParamType } from "@/cli/schemas/pattern.js";

describe("PatternJson schema", () => {
  const validPattern = {
    name: "distortion-media",
    category: "webgl",
    params: {
      intensity: { type: "number", default: 0.5, description: "Displacement strength" },
      rgbShift: { type: "number", default: 0.003, description: "RGB shift amount" },
    },
    budgets: { maxDrawcalls: 2, maxTextureMB: 4, targetGPUFrameMs: 16.7 },
    a11y: { reducedMotion: "opacity-only" },
    dependencies: ["@react-three/fiber", "three"],
    motionTokens: ["dur.reveal", "ease.hero"],
  };

  it("accepts a valid pattern", () => {
    const parsed = PatternJson.safeParse(validPattern);
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid category", () => {
    const parsed = PatternJson.safeParse({ ...validPattern, category: "invalid" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid reduced-motion strategy", () => {
    const parsed = PatternJson.safeParse({ ...validPattern, a11y: { reducedMotion: "fade" } });
    expect(parsed.success).toBe(false);
  });

  it("rejects a missing dependency list", () => {
    const parsed = PatternJson.safeParse({ ...validPattern, dependencies: undefined });
    expect(parsed.success).toBe(false);
  });

  it("exports category and param-type enums", () => {
    expect(PatternCategory.options).toContain("webgl");
    expect(PatternParamType.options).toContain("array");
  });
});
