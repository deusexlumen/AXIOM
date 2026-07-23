import { test, expect } from "@playwright/test";

test("portfolio page loads and reveals content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-axm-id='portfolio']")).toBeVisible();
  await expect(page.locator("text=Studio Obscura")).toBeVisible();
  await expect(page.locator("[data-axm-id='cursor-system']")).toBeVisible();
});
