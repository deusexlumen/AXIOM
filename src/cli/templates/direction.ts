export function directionAxmJson(): string {
  return JSON.stringify(
    {
      directionId: "dir_default",
      thesis: "Default ATELIER direction — neutral, high-contrast, editorial.",
      typography: {
        display: { family: "InterVariable", case: "mixed" },
        text: { family: "InterVariable" },
        scaleRatio: 1.333,
      },
      color: {
        story: "Dark surface, light text, single indigo accent.",
        tokensDraft: {
          "bg-primary": "#0B0F19",
          "text-primary": "#F5F7FA",
          "accent-primary": "#4F46E5",
        },
      },
      space: { language: "airy", density: 0.3, gridBias: "asymmetric" },
      motionPersonality: { adjectives: ["calm", "precise"], tempo: "mid", playfulness: 0.2 },
      texture: { grain: 0.05, noiseShader: false },
      webglLevel: 0,
      sceneIdeas: ["Hero: large display type over dark field"],
    },
    null,
    2,
  );
}
