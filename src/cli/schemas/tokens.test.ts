import { describe, it, expect } from "vitest";
import { TokensJson } from "@/cli/schemas/tokens.js";

describe("TokensJson schema", () => {
  it("accepts a valid token map", () => {
    const result = TokensJson.safeParse({
      color: { "action-primary": "#4F46E5" },
      space: { "2": "8px" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-object root", () => {
    const result = TokensJson.safeParse(["color"]);
    expect(result.success).toBe(false);
  });
});
