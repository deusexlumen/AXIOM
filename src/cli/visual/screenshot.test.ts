import { describe, it, expect } from "vitest";
import { captureScreenshot } from "@/cli/visual/screenshot.js";

describe("captureScreenshot", () => {
  it("throws AXM-V000 when routeUrl is empty", async () => {
    await expect(captureScreenshot("/tmp", "Button", "/tmp/out.png", "")).rejects.toThrow(
      "AXM-V000"
    );
  });
});
