import { describe, it, expect } from "vitest";
import { directionTokens } from "@/cli/generators/direction-tokens.js";
import type { DirectionJson } from "@/cli/schemas/direction.js";

const direction: DirectionJson = {
  directionId: "dir_test",
  thesis: "Test",
  typography: {
    display: { family: "FrauncesVariable", axis: { wght: [200, 900] } },
    text: { family: "InterVariable" },
    scaleRatio: 1.333,
  },
  color: {
    story: "Test",
    tokensDraft: { "bg-primary": "#0a0a0a", "text-primary": "#f0f0f0" },
  },
  space: { language: "airy", density: 0.3, gridBias: "asymmetric" },
  motionPersonality: { adjectives: ["calm"], tempo: "mid", playfulness: 0.5 },
  texture: { grain: 0, noiseShader: false },
  webglLevel: 0,
  sceneIdeas: ["Test"],
};

describe("directionTokens", () => {
  it("includes typography, spacing, and color tokens", () => {
    const tokens = directionTokens(direction);
    expect(tokens["font-size-base"]).toMatch(/^clamp\(/);
    expect(tokens["font-family-display"]).toContain("FrauncesVariable");
    expect(tokens["space-4"]).toMatch(/^\d+px$/);
    expect(tokens["color-bg-primary"]).toBe("#0a0a0a");
    expect(tokens["color-text-primary"]).toBe("#f0f0f0");
  });

  it("is deterministic for identical input", () => {
    expect(directionTokens(direction)).toStrictEqual(directionTokens(direction));
  });
});
