import { describe, it, expect } from "vitest";
import { generateStore } from "@/cli/generators/store.js";

describe("generateStore", () => {
  it("is deterministic", () => {
    const a = generateStore("counter", { count: "number" });
    const b = generateStore("counter", { count: "number" });
    expect(a).toBe(b);
  });

  it("produces a named export", () => {
    const code = generateStore("user", { name: "string" });
    expect(code).toContain("export const useUser");
  });
});
