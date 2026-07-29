import { describe, it, expect } from "vitest";
import { parseDiffRatio, visualPaths } from "@/cli/visual/diff.js";

describe("parseDiffRatio", () => {
  it("returns 0 for identical images", () => {
    expect(parseDiffRatio("0")).toBe(0);
  });

  it("parses count;percent output", () => {
    expect(parseDiffRatio("10000;100.00")).toBe(1);
    expect(parseDiffRatio("42;0.50")).toBe(0.005);
  });

  it("returns 0 for unexpected output", () => {
    expect(parseDiffRatio("")).toBe(0);
    expect(parseDiffRatio("error")).toBe(0);
  });
});

describe("visualPaths", () => {
  it("resolves visual artifact paths for a component", () => {
    const paths = visualPaths("/project", "Button");
    expect(paths.actual).toMatch(/pipeline.visual.Button\.actual\.png$/);
    expect(paths.baseline).toMatch(/pipeline.visual.Button\.baseline\.png$/);
    expect(paths.diff).toMatch(/pipeline.visual.Button\.diff\.png$/);
  });
});
