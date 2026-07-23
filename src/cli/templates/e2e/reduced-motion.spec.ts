export function reducedMotionSpecTs(): string {
  return `import { test, expect } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("hero uses opacity-only path when reduced motion is preferred", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator('[data-axm-id="HeroDemo"]');
    await hero.waitFor();

    const styles = await hero.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return { opacity: computed.opacity, transform: computed.transform };
    });

    expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
    expect(styles.transform).toBe("none");
  });
});
`;
}
