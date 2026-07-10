import { describe, it, expect } from "vitest";
import { themeCss } from "@/cli/generators/tokens.js";

describe("themeCss", () => {
  it("is deterministic", () => {
    const tokens = { color: { primary: "#000" } };
    expect(themeCss(tokens)).toBe(themeCss(tokens));
  });

  it("emits :root and @theme inline blocks", () => {
    const css = themeCss({ color: { primary: "#000" } });
    expect(css).toContain(":root");
    expect(css).toContain("@theme inline");
    expect(css).toContain("--color-primary: var(--color-primary)");
  });
});
