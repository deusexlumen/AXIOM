import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

const budget = { maxLongTasks: 1 };
const a11y = { reducedMotion: "opacity-only" as const };

export const typoPatterns: PatternCatalogItem[] = [
  {
    name: "split-reveal",
    category: "typo",
    params: {
      text: { type: "string", default: "Distinction in motion", description: "Text to reveal" },
      staggerToken: { type: "string", default: "motion.stagger.chars", description: "Stagger token path" },
    },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.reveal", "ease.hero", "stagger.chars"],
    wave: 1,
  },
  {
    name: "weight-breathe",
    category: "typo",
    params: {
      text: { type: "string", default: "Breathe", description: "Text to animate" },
      axisWght: { type: "array", default: [200, 900], description: "Variable weight axis range [min, max]" },
    },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.scene", "ease.drift"],
    wave: 1,
  },
  {
    name: "marquee-velocity",
    category: "typo",
    params: {
      text: { type: "string", default: "Velocity is a feeling — ", description: "Marquee text" },
      baseSpeed: { type: "number", default: 1, description: "Base marquee speed multiplier" },
    },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.ui", "ease.snap"],
    wave: 1,
  },
];
