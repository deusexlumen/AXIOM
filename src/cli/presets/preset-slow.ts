import type { Preset } from "@/cli/presets/types.js";

export const SLOW_PRESETS: Preset[] = [
  {
    directionId: "preset_monolith",
    thesis: "A brutalist monolith of type and shadow where silence carries more weight than motion.",
    typography: {
      display: { family: "ClashDisplayVariable", axis: { wght: [200, 700] }, case: "upper" },
      text: { family: "InterVariable", axis: { wght: [400, 600] } },
      scaleRatio: 1.5,
    },
    color: {
      story: "Deep stone surfaces pierced by a single warm accent, like light through concrete.",
      tokensDraft: {
        "bg-primary": "#111111",
        "text-primary": "#F3F3F3",
        accent: "#FF4D00",
        surface: "#1A1A1A",
        border: "#333333",
        shadow: "#000000",
      },
    },
    space: { language: "expansive", density: 0.15, gridBias: "symmetric" },
    motionPersonality: { adjectives: ["solemn", "ponderous", "tectonic"], tempo: "slow", playfulness: 0.1 },
    texture: { grain: 0.12, noiseShader: true },
    webglLevel: 1,
    sceneIdeas: [
      "Hero: oversized uppercase headline sliding up over a dark field",
      "Gallery: full-bleed images with slow parallax and no captions",
    ],
    moodMatch: ["brutalist", "monumental", "heavy", "dark", "minimal", "premium"],
    antiMatch: ["playful", "fast", "colorful", "light"],
  },
  {
    directionId: "preset_quiet_luxury",
    thesis: "Whispered elegance: generous whitespace, soft curves, and motion that waits to be noticed.",
    typography: {
      display: { family: "BoskaVariable", axis: { wght: [300, 500], ital: [0, 1] }, case: "mixed" },
      text: { family: "InterVariable", axis: { wght: [400, 500] } },
      scaleRatio: 1.25,
    },
    color: {
      story: "Warm ivory and ash grey with a muted gold accent for moments of focus.",
      tokensDraft: {
        "bg-primary": "#F8F6F2",
        "text-primary": "#2C2C2C",
        accent: "#C9A227",
        surface: "#FFFFFF",
        border: "#E5E2DC",
        shadow: "#D9D6D0",
      },
    },
    space: { language: "airy", density: 0.2, gridBias: "asymmetric" },
    motionPersonality: { adjectives: ["soft", "restrained", "breathing"], tempo: "slow", playfulness: 0.15 },
    texture: { grain: 0.04, noiseShader: false },
    webglLevel: 0,
    sceneIdeas: [
      "Hero: serif display line fading in word by word over warm ivory",
      "Feature cards with gentle lift on hover and thin hairline borders",
    ],
    moodMatch: ["elegant", "refined", "soft", "premium", "minimal", "luxury"],
    antiMatch: ["loud", "fast", "glitch", "bold"],
  },
];
