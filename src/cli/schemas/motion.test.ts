import { describe, it, expect } from "vitest";
import { MotionJson } from "@/cli/schemas/motion.js";

const validMotion = {
  ease: { hero: { curve: [0.16, 1, 0.3, 1], meaning: "h" } },
  dur: { micro: 0.18, max: 2.2 },
  stagger: { chars: 0.018 },
  scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
  transitions: { enter: { grammar: "g", dur: "micro", ease: "hero" } },
  choreography: { revealOrder: ["a"], maxConcurrentTimelines: 1 },
  reducedMotion: { strategy: "s", durFactor: 0.5 },
};

type ParseResult = ReturnType<typeof MotionJson.safeParse>;
type Issue = { path: (string | number)[]; message: string };

function issue(path: (string | number)[], message: string): Issue {
  return { path, message };
}

function expectIssues(result: ParseResult, expected: Issue[]): void {
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.map((i) => ({ path: i.path, message: i.message }))).toEqual(expected);
  }
}

describe("MotionJson schema", () => {
  it("accepts a valid default MOTION object", () => {
    expect(MotionJson.safeParse(validMotion).success).toBe(true);
  });

  it("accepts a duration exactly equal to dur.max", () => {
    const result = MotionJson.safeParse({ ...validMotion, dur: { micro: 2.2, max: 2.2 } });
    expect(result.success).toBe(true);
  });

  it("rejects a missing required top-level field", () => {
    const { reducedMotion: _, ...data } = validMotion;
    expectIssues(MotionJson.safeParse(data), [issue(["reducedMotion"], "Required")]);
  });

  it("rejects a missing dur.max cap", () => {
    const { max: _, ...dur } = validMotion.dur;
    expectIssues(MotionJson.safeParse({ ...validMotion, dur }), [issue(["dur", "max"], "Required")]);
  });

  it("rejects a transition with a missing dur token", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      transitions: { bad: { grammar: "g", dur: "missing", ease: "hero" } },
    });
    expectIssues(result, [issue(["transitions", "bad", "dur"], 'transition "bad" references unknown dur token "missing"')]);
  });

  it("rejects a transition with a missing ease token", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      transitions: { bad: { grammar: "g", dur: "micro", ease: "missing" } },
    });
    expectIssues(result, [issue(["transitions", "bad", "ease"], 'transition "bad" references unknown ease token "missing"')]);
  });

  it("rejects empty ease/dur records when transitions reference them", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      ease: {},
      dur: { max: 2.2 },
      transitions: { enter: { grammar: "g", dur: "micro", ease: "hero" } },
    });
    expectIssues(result, [
      issue(["transitions", "enter", "dur"], 'transition "enter" references unknown dur token "micro"'),
      issue(["transitions", "enter", "ease"], 'transition "enter" references unknown ease token "hero"'),
    ]);
  });

  it("allows empty ease/dur records when no transitions reference them", () => {
    const result = MotionJson.safeParse({ ...validMotion, ease: {}, dur: { max: 2.2 }, transitions: {} });
    expect(result.success).toBe(true);
  });

  it("rejects a duration exceeding dur.max", () => {
    const result = MotionJson.safeParse({ ...validMotion, dur: { micro: 3, max: 2.2 } });
    expectIssues(result, [issue(["dur", "micro"], "dur.micro (3) exceeds dur.max (2.2)")]);
  });

  it("rejects an ease curve tuple with the wrong length", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      ease: { ...validMotion.ease, bad: { curve: [0, 1, 2], meaning: "x" } },
    });
    expectIssues(result, [issue(["ease", "bad", "curve"], "Array must contain at least 4 element(s)")]);
  });

  it("rejects malformed ease curve element types", () => {
    const result = MotionJson.safeParse({
      ...validMotion,
      ease: { ...validMotion.ease, bad: { curve: ["a", 1, 0.3, 1], meaning: "x" } },
    });
    expectIssues(result, [issue(["ease", "bad", "curve", 0], "Expected number, received string")]);
  });
});
