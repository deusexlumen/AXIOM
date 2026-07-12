export function reducedMotionSpecTs(): string {
  return `import { test, expect } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("home page renders under reduced motion preference", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
`;
}
