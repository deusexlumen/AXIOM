import { describe, it, expect } from "vitest";
import { motionTs } from "@/cli/generators/motion.js";
import type { MotionJson } from "@/cli/schemas/motion.js";

const motion: MotionJson = {
  ease: {
    hero: { curve: [0.16, 1, 0.3, 1], meaning: "große Enthüllungen" },
    snap: { curve: [0.83, 0, 0.17, 1], meaning: "UI-Feedback" },
  },
  dur: { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 },
  stagger: { chars: 0.018, lines: 0.08, items: 0.12 },
  scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
  transitions: {
    pageEnter: { grammar: "mask-wipe-up", dur: "scene", ease: "hero" },
    pageExit: { grammar: "fade-scale-098", dur: "ui", ease: "snap" },
  },
  choreography: { revealOrder: ["display-text", "media"], maxConcurrentTimelines: 3 },
  reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
};

const expected = `export const motion = {
  ease: {
    hero: [0.16, 1, 0.3, 1] as const,
    snap: [0.83, 0, 0.17, 1] as const,
  },
  dur: {
    micro: 0.18,
    ui: 0.35,
    reveal: 0.9,
    scene: 1.6,
    max: 2.2,
  },
  stagger: {
    chars: 0.018,
    lines: 0.08,
    items: 0.12,
  },
  scroll: {"lenis":{"lerp":0.09},"scrubDefault":0.8,"pinSpacing":true},
  transitions: {
    pageEnter: { grammar: "mask-wipe-up", dur: 1.6, ease: [0.16, 1, 0.3, 1] as const },
    pageExit: { grammar: "fade-scale-098", dur: 0.35, ease: [0.83, 0, 0.17, 1] as const },
  },
  choreography: {"revealOrder":["display-text","media"],"maxConcurrentTimelines":3},
  reducedMotion: {"strategy":"opacity-only","durFactor":0.5},
} as const;

export type Motion = typeof motion;`;

describe("motionTs generator", () => {
  it("produces byte-identical golden output", () => {
    expect(motionTs(motion)).toBe(expected);
  });

  it("throws when a transition duration exceeds dur.max", () => {
    const bad: MotionJson = {
      ...motion,
      dur: { ...motion.dur, scene: 5 },
      transitions: {
        bad: { grammar: "slow", dur: "scene", ease: "hero" },
      },
    };
    expect(() => motionTs(bad)).toThrow(/exceeds dur.max/);
  });
});
