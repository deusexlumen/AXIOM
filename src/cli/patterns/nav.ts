import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

const budget = { maxLongTasks: 1 };
const a11y = { reducedMotion: "opacity-only" as const };

export const navPatterns: PatternCatalogItem[] = [
  {
    name: "page-mask-transition",
    category: "nav",
    params: { grammar: { type: "string", default: "mask-wipe-up", description: "Transition grammar" } },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.scene", "ease.hero"],
    wave: 2,
  },
  {
    name: "webgl-crossfade",
    category: "nav",
    params: { duration: { type: "number", default: 1.2, description: "Crossfade duration" } },
    budgets: budget,
    a11y,
    dependencies: ["gsap", "@react-three/fiber", "three"],
    motionTokens: ["dur.scene", "ease.hero"],
    wave: 2,
  },
  {
    name: "magnetic-cta",
    category: "nav",
    params: { strength: { type: "number", default: 0.4, description: "Magnetic pull strength" } },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.micro", "ease.snap"],
    wave: 2,
  },
  {
    name: "cursor-system",
    category: "nav",
    params: { blendMode: { type: "string", default: "difference", description: "Cursor blend mode" } },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.micro", "ease.snap"],
    wave: 2,
  },
  {
    name: "preloader-counter",
    category: "nav",
    params: { label: { type: "string", default: "Loading", description: "Preloader label" } },
    budgets: budget,
    a11y,
    dependencies: ["gsap"],
    motionTokens: ["dur.reveal", "ease.hero"],
    wave: 2,
  },
];
