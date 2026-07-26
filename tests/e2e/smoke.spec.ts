import { test, expect } from "@playwright/test";

test("page loads without console errors and shows headline", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("hero reveal is in flight right after the preloader lifts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  // The split-reveal must still be animating: at least one .line has a
  // non-identity transform at a sampled point (polls each animation frame).
  await page.waitForFunction(() => {
    const lines = document.querySelectorAll(".line");
    if (lines.length === 0) return false;
    return Array.from(lines).some((el) => {
      const t = getComputedStyle(el).transform;
      return t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)";
    });
  });
});

test("renders under reduced motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  await ctx.close();
});
