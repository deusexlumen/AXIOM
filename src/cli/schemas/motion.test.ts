import { describe, it, expect } from "vitest";
import { MotionJson } from "@/cli/schemas/motion.js";

const validMotion = {
  ease: {
    hero: { curve: [0.16, 1, 0.3, 1], meaning: "große Enthüllungen" },
    snap: { curve: [0.83, 0, 0.17, 1], meaning: "UI-Feedback" },
    drift: { curve: [0.25, 0.1, 0.25, 1], meaning: "Ambient/Parallax" },
  },
  dur: { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 },
  stagger: { chars: 0.018, lines: 0.08, items: 0.12 },
  scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
  transitions: {
    pageEnter: { grammar: "mask-wipe-up", dur: "scene", ease: "hero" },
    pageExit: { grammar: "fade-scale-098", dur: "ui", ease: "snap" },
  },
  choreography: {
    revealOrder: ["display-text", "media", "body-text", "meta"],
    maxConcurrentTimelines: 3,
  },
  reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
};

type Issue = { path: Array<string | number>; message: string };
type SafeParseResult =
  | { success: true }
  | { success: false; error: { issues: Issue[] } };

function expectIssue(
  result: SafeParseResult,
  path: Array<string | number>,
  message: string,
): void {
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path,
          message: expect.stringContaining(message),
        }),
      ]),
    );
  }
}

describe("MotionJson schema", () => {
  it("accepts a valid default MOTION object", () => {
    const result = MotionJson.safeParse(validMotion);
    expect(result.success).toBe(true);
  });

  it("rejects a transition with a missing dur token", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      transitions: {
        bad: { grammar: "fade", dur: "missing", ease: "hero" },
      },
    });
    expectIssue(result, ["transitions", "bad", "dur"], "unknown dur token");
  });

  it("rejects a transition with a missing ease token", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      transitions: {
        bad: { grammar: "fade", dur: "ui", ease: "missing" },
      },
    });
    expectIssue(result, ["transitions", "bad", "ease"], "unknown ease token");
  });

  it("rejects a duration exceeding dur.max", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      dur: { ...validMotion.dur, scene: 3 },
    });
    expectIssue(result, ["dur", "scene"], "exceeds dur.max");
  });

  it("rejects an ease curve tuple with the wrong length", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      ease: { ...validMotion.ease, bad: { curve: [0, 1, 2], meaning: "bad" } },
    });
    expectIssue(result, ["ease", "bad", "curve"], "at least 4");
  });
});
