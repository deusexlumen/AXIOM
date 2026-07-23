import type { Preset } from "@/cli/presets/types.js";

export const MID_PRESETS: Preset[] = [
  {
    directionId: "preset_editorial",
    thesis: "Editorial rhythm: column grids, sharp hierarchy, and confident pacing for long-form reading.",
    typography: {
      display: { family: "FrauncesVariable", axis: { wght: [300, 800], opsz: [9, 144] }, case: "mixed" },
      text: { family: "InterVariable", axis: { wght: [400, 600] } },
      scaleRatio: 1.414,
    },
    color: {
      story: "Paper white with ink black and a single editorial red for pull-quotes and CTAs.",
      tokensDraft: {
        "bg-primary": "#FAFAFA",
        "text-primary": "#121212",
        accent: "#D00000",
        surface: "#FFFFFF",
        border: "#E0E0E0",
        shadow: "#BDBDBD",
      },
    },
    space: { language: "airy", density: 0.35, gridBias: "symmetric" },
    motionPersonality: { adjectives: ["measured", "articulate", "fluent"], tempo: "mid", playfulness: 0.25 },
    texture: { grain: 0.03, noiseShader: false },
    webglLevel: 0,
    sceneIdeas: [
      "Landing: magazine cover layout with asymmetric headline and large feature image",
      "Article stream: sticky chapter headings and smooth scroll-driven typography",
    ],
    moodMatch: ["editorial", "magazine", "classic", "structured", "readable"],
    antiMatch: ["chaotic", "experimental", "maximalist"],
  },
  {
    directionId: "preset_neon_playful",
    thesis: "Friendly tech: rounded geometry, electric accents, and motion that bounces with intent.",
    typography: {
      display: { family: "SpaceGroteskVariable", axis: { wght: [400, 700] }, case: "mixed" },
      text: { family: "InterVariable", axis: { wght: [400, 600] } },
      scaleRatio: 1.333,
    },
    color: {
      story: "Near-black canvas lit by neon violet and electric cyan signals.",
      tokensDraft: {
        "bg-primary": "#0A0A12",
        "text-primary": "#F0F0FF",
        accent: "#B829DD",
        surface: "#14141E",
        border: "#2A2A40",
        shadow: "#B829DD",
      },
    },
    space: { language: "dense", density: 0.55, gridBias: "asymmetric" },
    motionPersonality: { adjectives: ["bouncy", "bright", "snappy"], tempo: "mid", playfulness: 0.7 },
    texture: { grain: 0.06, noiseShader: false },
    webglLevel: 1,
    sceneIdeas: [
      "Hero: stacked display words with staggered pop-in and gradient underline",
      "Feature grid: rounded cards with hover glow and magnetic CTA buttons",
    ],
    moodMatch: ["playful", "tech", "modern", "vibrant", "friendly"],
    antiMatch: ["serious", "dark", "slow", "minimal"],
  },
];
