import { describe, it, expect } from "vitest";
import { generateComponent, defaultComponentSpec } from "@/cli/generators/component.js";

describe("generateComponent", () => {
  it("produces deterministic output", () => {
    const spec = defaultComponentSpec("Button");
    const a = generateComponent("Button", spec);
    const b = generateComponent("Button", spec);
    expect(a.component).toBe(b.component);
    expect(a.spec).toBe(b.spec);
    expect(a.test).toBe(b.test);
  });

  it("includes data-axm-id", () => {
    const { component } = generateComponent("Card", defaultComponentSpec("Card"));
    expect(component).toContain('data-axm-id="Card"');
  });

  it("wraps contract tests in axiom markers", () => {
    const { test } = generateComponent("Card", defaultComponentSpec("Card"));
    expect(test).toContain("// @axiom:contract:start sha256:");
    expect(test).toContain("// @axiom:contract:end");
  });
});
