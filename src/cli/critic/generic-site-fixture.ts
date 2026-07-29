import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { writeJson } from "@/cli/critic/test-fixtures.js";

export function createGenericSite(baseDir: string): void {
  mkdirSync(resolve(baseDir, "app"), { recursive: true });
  mkdirSync(resolve(baseDir, "src", "generated"), { recursive: true });
  writeJson(resolve(baseDir, "tokens.json"), {
    color: {
      action: { primary: "#3B82F6", danger: "#EF4444" },
      surface: { base: "#020617", raised: "#151B2B" },
      text: { primary: "#F8FAFC", muted: "#94A3B8" },
    },
    font: { family: { base: "Inter, sans-serif" } },
  });
  writeFileSync(
    resolve(baseDir, "src/generated/theme.css"),
    `:root { --font-family-base: Inter, sans-serif; --color-action-primary: #3B82F6; }`,
    "utf-8"
  );
  writeJson(resolve(baseDir, "MOTION.axm.json"), {
    ease: {
      linear: { curve: [0, 0, 1, 1], meaning: "linear" },
      out: { curve: [0.25, 0.1, 0.25, 1], meaning: "power1" },
    },
    dur: { micro: 0.18, ui: 0.35, max: 2 },
    stagger: {},
    scroll: { lenis: { lerp: 0.1 }, scrubDefault: 0.8, pinSpacing: true },
    transitions: {},
    choreography: { revealOrder: [], maxConcurrentTimelines: 3 },
    reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
  });
  writeFileSync(
    resolve(baseDir, "app/page.tsx"),
    [
      `export default function Home() { return (`,
      `  <section className="hero flex flex-col items-center justify-center">`,
      `    <span className="badge rounded-full px-4 py-1">New</span>`,
      `    <h1>Build faster</h1>`,
      `    <p>The ultimate platform for teams.</p>`,
      `    <div className="flex gap-4">`,
      `      <button className="primary">Get started</button>`,
      `      <button className="secondary">Learn more</button>`,
      `    </div>`,
      `  </section>`,
      `  <section className="grid grid-cols-3">`,
      `    <div className="card">A</div>`,
      `    <div className="card">B</div>`,
      `    <div className="card">C</div>`,
      `  </section>`,
      `); }`,
    ].join("\n"),
    "utf-8"
  );
}
