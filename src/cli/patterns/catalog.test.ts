import { describe, it, expect } from "vitest";
import { getPattern, listPatterns } from "@/cli/patterns/catalog.js";

describe("pattern catalog", () => {
  it("contains 18 wave-1 + wave-2 patterns", () => {
    expect(listPatterns()).toHaveLength(18);
  });

  it("returns wave-1 patterns when filtering by wave", () => {
    const wave1 = listPatterns().filter((p) => p.wave === 1);
    expect(wave1).toHaveLength(9);
  });

  it("getPattern finds distortion-media", () => {
    const p = getPattern("distortion-media");
    expect(p).toBeDefined();
    expect(p?.category).toBe("webgl");
    expect(p?.dependencies).toContain("@react-three/fiber");
  });

  it("listPatterns filters by category", () => {
    expect(listPatterns("webgl")).toHaveLength(6);
    expect(listPatterns("scroll")).toHaveLength(4);
    expect(listPatterns("typo")).toHaveLength(3);
    expect(listPatterns("nav")).toHaveLength(5);
  });

  it("returns undefined for unknown pattern", () => {
    expect(getPattern("does-not-exist")).toBeUndefined();
  });

  it("wave-1 patterns have default params", () => {
    const p = getPattern("pinned-narrative");
    const sections = p?.params.sections;
    expect(sections).toBeDefined();
    expect(Array.isArray(sections?.default)).toBe(true);
  });
});
