import type { Preset } from "@/cli/presets/types.js";

export const FAST_PRESETS: Preset[] = [
  {
    directionId: "preset_velocity",
    thesis: "High-speed confidence: diagonal tension, kinetic type, and cuts that keep the eye racing.",
    typography: {
      display: { family: "NeueMachinaVariable", axis: { wght: [400, 800] }, case: "upper" },
      text: { family: "InterVariable", axis: { wght: [400, 700] } },
      scaleRatio: 1.618,
    },
    color: {
      story: "Racing red and asphalt black with white impact strips for calls to action.",
      tokensDraft: {
        "bg-primary": "#080808",
        "text-primary": "#FFFFFF",
        accent: "#FF2A2A",
        surface: "#141414",
        border: "#2B2B2B",
        shadow: "#FF2A2A",
      },
    },
    space: { language: "compact", density: 0.7, gridBias: "broken" },
    motionPersonality: { adjectives: ["kinetic", "aggressive", "urgent"], tempo: "fast", playfulness: 0.4 },
    texture: { grain: 0.08, noiseShader: true },
    webglLevel: 2,
    sceneIdeas: [
      "Hero: diagonal split with large type tracked tight and a scrolling ticker",
      "Media strip: full-width cards that skew on scroll velocity",
    ],
    moodMatch: ["kinetic", "racing", "dynamic", "bold", "urgent"],
    antiMatch: ["calm", "slow", "soft", "minimal"],
  },
  {
    directionId: "preset_chromatic_glitch",
    thesis: "Controlled chaos: chromatic aberration, fractured grids, and motion that refuses to sit still.",
    typography: {
      display: { family: "TekoVariable", axis: { wght: [300, 700] }, case: "upper" },
      text: { family: "InterVariable", axis: { wght: [400, 600] } },
      scaleRatio: 1.5,
    },
    color: {
      story: "Overlapping cyan, magenta, and yellow channels on a deep black stage.",
      tokensDraft: {
        "bg-primary": "#050505",
        "text-primary": "#F5F5F5",
        accent: "#00F0FF",
        surface: "#101010",
        border: "#333333",
        shadow: "#FF00AA",
      },
    },
    space: { language: "dense", density: 0.65, gridBias: "broken" },
    motionPersonality: { adjectives: ["erratic", "loud", "experimental"], tempo: "fast", playfulness: 0.9 },
    texture: { grain: 0.18, noiseShader: true },
    webglLevel: 3,
    sceneIdeas: [
      "Hero: chromatic-split type with displacement mapped to cursor velocity",
      "Gallery: grid tiles that glitch on hover using WebGL feedback",
    ],
    moodMatch: ["experimental", "glitch", "maximalist", "high-energy", "loud"],
    antiMatch: ["calm", "minimal", "elegant", "quiet"],
  },
];
