import { describe, it, expect, vi } from "vitest";
import { hasWebGL } from "@/webgl/hasWebGL";

describe("hasWebGL", () => {
  it("returns false when getContext yields null", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(hasWebGL()).toBe(false);
  });
});
