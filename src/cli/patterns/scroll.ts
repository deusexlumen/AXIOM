import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

const budget = { maxLongTasks: 1 };
const a11y = { reducedMotion: "opacity-only" as const };

export const scrollPatterns: PatternCatalogItem[] = [
  {
    name: "pinned-narrative",
    category: "scroll",
    params: {
      sections: {
        type: "array",
        default: [
          { title: "Chapter One", body: "Open with tension." },
          { title: "Chapter Two", body: "Build the argument." },
          { title: "Chapter Three", body: "Release into clarity." },
        ],
        description: "Scrubbed narrative sections",
      },
    },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.scene", "ease.hero", "scroll.scrubDefault"],
    wave: 1,
  },
  {
    name: "horizontal-drift",
    category: "scroll",
    params: {
      items: {
        type: "array",
        default: [
          { title: "Drift One", image: "/drift-1.jpg" },
          { title: "Drift Two", image: "/drift-2.jpg" },
          { title: "Drift Three", image: "/drift-3.jpg" },
        ],
        description: "Horizontal panels with title and image",
      },
    },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.reveal", "ease.drift"],
    wave: 1,
  },
  {
    name: "parallax-stack",
    category: "scroll",
    params: {
      layers: {
        type: "array",
        default: [
          { speed: 0.2, content: "Back layer" },
          { speed: 0.5, content: "Middle layer" },
          { speed: 1.0, content: "Front layer" },
        ],
        description: "Z-space parallax layers",
      },
    },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["ease.drift"],
    wave: 1,
  },
  {
    name: "sequence-scrub",
    category: "scroll",
    params: { frames: { type: "number", default: 60, description: "Number of frames" } },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["scroll.scrubDefault"],
    wave: 2,
  },
];
