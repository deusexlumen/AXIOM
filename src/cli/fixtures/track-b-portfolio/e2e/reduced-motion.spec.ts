import { test, expect } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("split-reveal uses opacity-only path when reduced motion is preferred", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator('[data-axm-id="split-reveal"]').first();
    await heading.waitFor();

    const styles = await heading.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return { opacity: computed.opacity, transform: computed.transform };
    });

    expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    expect(styles.transform).toBe("none");
  });
});
