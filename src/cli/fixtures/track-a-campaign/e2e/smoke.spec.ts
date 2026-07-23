import { test, expect } from "@playwright/test";

test("campaign page loads and reveals content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-axm-id='campaign']")).toBeVisible();
  await expect(page.locator("text=Curated Motion")).toBeVisible();
  await expect(page.locator("[data-axm-id='magnetic-cta']")).toBeVisible();
});
