import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

const budget = { maxDrawcalls: 4, maxTextureMB: 8, targetGPUFrameMs: 16.7 };
const a11y = { reducedMotion: "opacity-only" as const };

export const webglPatterns: PatternCatalogItem[] = [
  {
    name: "distortion-media",
    category: "webgl",
    params: {
      intensity: { type: "number", default: 0.5, description: "Displacement strength on hover" },
      rgbShift: { type: "number", default: 0.003, description: "RGB channel split amount" },
    },
    budgets: budget,
    a11y,
    dependencies: ["@react-three/fiber", "three"],
    motionTokens: ["dur.reveal", "ease.hero"],
    wave: 1,
  },
  {
    name: "flowmap-hero",
    category: "webgl",
    params: {
      trailStrength: { type: "number", default: 0.4, description: "Fluid trail persistence" },
      dissipation: { type: "number", default: 0.92, description: "Trail dissipation factor" },
    },
    budgets: budget,
    a11y,
    dependencies: ["@react-three/fiber", "three"],
    motionTokens: ["dur.ui", "ease.drift"],
    wave: 1,
  },
  {
    name: "particle-type",
    category: "webgl",
    params: {
      text: { type: "string", default: "AXIOM", description: "Text to form from particles" },
      particleCount: { type: "number", default: 2048, description: "Number of particles" },
    },
    budgets: { ...budget, maxDrawcalls: 1 },
    a11y,
    dependencies: ["@react-three/fiber", "three", "@react-three/drei"],
    motionTokens: ["dur.scene", "ease.hero"],
    wave: 1,
  },
  {
    name: "mesh-gradient-bg",
    category: "webgl",
    params: { speed: { type: "number", default: 0.2, description: "Gradient animation speed" } },
    budgets: budget,
    a11y,
    dependencies: ["@react-three/fiber", "three"],
    motionTokens: ["dur.scene", "ease.drift"],
    wave: 2,
  },
  {
    name: "dither-shader",
    category: "webgl",
    params: { scale: { type: "number", default: 1, description: "Dither scale" } },
    budgets: budget,
    a11y,
    dependencies: ["@react-three/fiber", "three"],
    motionTokens: ["dur.ui"],
    wave: 2,
  },
  {
    name: "depth-gallery",
    category: "webgl",
    params: { items: { type: "array", default: ["1", "2", "3"], description: "Gallery items" } },
    budgets: budget,
    a11y,
    dependencies: ["@react-three/fiber", "three"],
    motionTokens: ["dur.scene", "ease.hero"],
    wave: 2,
  },
];
