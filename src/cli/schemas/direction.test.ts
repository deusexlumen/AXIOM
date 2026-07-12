import { describe, it, expect } from "vitest";
import { DirectionJson } from "@/cli/schemas/direction.js";

const validDirection = {
  directionId: "dir_B",
  thesis: "Monolith im Nebel",
  typography: {
    display: { family: "FrauncesVariable", axis: { wght: [200, 900] }, case: "mixed" },
    text: { family: "InterVariable" },
    scaleRatio: 1.333,
  },
  color: {
    story: "3 Flächen, 1 Akzent",
    tokensDraft: { "bg-primary": "#0a0a0a", "text-primary": "#f0f0f0" },
  },
  space: { language: "airy", density: 0.3, gridBias: "asymmetric" },
  motionPersonality: { adjectives: ["träge-cinematisch"], tempo: "slow", playfulness: 0.1 },
  texture: { grain: 0.15, noiseShader: true },
  webglLevel: 2,
  sceneIdeas: ["Hero: volumetrischer Nebel"],
};

describe("DirectionJson schema", () => {
  it("accepts a valid direction document", () => {
    expect(() => DirectionJson.parse(validDirection)).not.toThrow();
  });

  it("rejects a missing directionId", () => {
    const bad = { ...validDirection, directionId: undefined };
    expect(() => DirectionJson.parse(bad)).toThrow();
  });

  it("rejects scaleRatio out of range", () => {
    const bad = { ...validDirection, typography: { ...validDirection.typography, scaleRatio: 2.5 } };
    expect(() => DirectionJson.parse(bad)).toThrow();
  });

  it("rejects webglLevel out of range", () => {
    const bad = { ...validDirection, webglLevel: 4 };
    expect(() => DirectionJson.parse(bad)).toThrow();
  });
});
