import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { writeJson } from "@/cli/critic/test-fixtures.js";

export function createCuratedProject(baseDir: string): void {
  mkdirSync(resolve(baseDir, "app"), { recursive: true });
  mkdirSync(resolve(baseDir, "src", "generated"), { recursive: true });
  writeJson(resolve(baseDir, "DIRECTION.axm.json"), {
    directionId: "dir_editorial",
    thesis: "Editorial warmth with bespoke serif display.",
    typography: {
      display: { family: "FrauncesVariable" },
      text: { family: "InterVariable" },
      scaleRatio: 1.333,
    },
    color: {
      story: "Warm paper, ink black, terracotta accent.",
      tokensDraft: { "bg-primary": "#F5F0E8", "text-primary": "#1A1A1A", "accent-primary": "#C45D3A" },
    },
    space: { language: "airy", density: 0.3, gridBias: "asymmetric" },
    motionPersonality: { adjectives: ["calm"], tempo: "mid", playfulness: 0.2 },
    texture: { grain: 0.05, noiseShader: false },
    webglLevel: 0,
    sceneIdeas: ["Hero: large display type over warm field"],
  });
  writeJson(resolve(baseDir, "tokens.json"), {
    color: { action: { primary: "#C45D3A" }, surface: { base: "#F5F0E8" }, text: { primary: "#1A1A1A" } },
  });
  writeFileSync(
    resolve(baseDir, "src/generated/theme.css"),
    `:root { --font-family-display: "FrauncesVariable", serif; --font-family-text: "InterVariable", sans-serif; --color-action-primary: #C45D3A; }`,
    "utf-8"
  );
  writeJson(resolve(baseDir, "MOTION.axm.json"), {
    ease: {
      hero: { curve: [0.16, 1, 0.3, 1], meaning: "reveal" },
      snap: { curve: [0.83, 0, 0.17, 1], meaning: "ui" },
    },
    dur: { micro: 0.18, ui: 0.35, max: 2 },
    stagger: {},
    scroll: { lenis: { lerp: 0.1 }, scrubDefault: 0.8, pinSpacing: true },
    transitions: {},
    choreography: { revealOrder: [], maxConcurrentTimelines: 3 },
    reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
  });
  writeFileSync(resolve(baseDir, "app/page.tsx"), `export default function Home() { return <h1>Editorial</h1>; }`, "utf-8");
}
