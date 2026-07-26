import { describe, it, expect } from "vitest";
import { EASE, DUR, STAGGER, cssEase } from "@/motion/tokens";

describe("motion tokens", () => {
  it("hero ease is the spec reveal curve", () => {
    expect(EASE.hero).toEqual([0.16, 1, 0.3, 1]);
  });
  it("durations never exceed max", () => {
    for (const v of Object.values(DUR)) expect(v).toBeLessThanOrEqual(DUR.max);
  });
  it("cssEase formats a cubic-bezier string", () => {
    expect(cssEase("snap")).toBe("cubic-bezier(0.83,0,0.17,1)");
  });
  it("stagger values are positive", () => {
    for (const v of Object.values(STAGGER)) expect(v).toBeGreaterThan(0);
  });
});
