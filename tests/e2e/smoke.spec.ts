import { test, expect } from "@playwright/test";

test("page loads without console errors and shows headline", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("renders under reduced motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  await ctx.close();
});
