import { describe, it, expect } from "vitest";
import { fluidTypeTokens, typographyTokensFromDirection } from "@/cli/generators/typography.js";
import type { DirectionJson } from "@/cli/schemas/direction.js";

const direction: DirectionJson = {
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
};

describe("fluidTypeTokens", () => {
  it("generates clamp tokens for every step", () => {
    const tokens = fluidTypeTokens(1.333);
    expect(Object.keys(tokens)).toEqual([
      "font-size-xs",
      "font-size-sm",
      "font-size-base",
      "font-size-lg",
      "font-size-xl",
      "font-size-2xl",
      "font-size-3xl",
      "font-size-display",
    ]);
    expect(tokens["font-size-base"]).toMatch(/^clamp\(/);
    expect(tokens["font-size-base"]).toContain("px");
  });

  it("is deterministic for identical input", () => {
    expect(fluidTypeTokens(1.2)).toStrictEqual(fluidTypeTokens(1.2));
  });

  it("increases sizes with higher scale ratio", () => {
    const small = fluidTypeTokens(1.2);
    const large = fluidTypeTokens(1.5);
    const extractMax = (value: string): number => {
      const parts = value.match(/clamp\([^,]+,[^,]+,\s*([\d.]+)px\)/);
      const matched = parts?.[1];
      return parseFloat(matched ?? "0");
    };
    expect(extractMax(large["font-size-xl"] ?? "")).toBeGreaterThan(extractMax(small["font-size-xl"] ?? ""));
  });
});

describe("typographyTokensFromDirection", () => {
  it("includes fluid sizes and font families", () => {
    const tokens = typographyTokensFromDirection(direction);
    expect(tokens["font-family-display"]).toContain("FrauncesVariable");
    expect(tokens["font-family-text"]).toContain("InterVariable");
    expect(tokens["font-size-base"]).toMatch(/^clamp\(/);
  });
});
