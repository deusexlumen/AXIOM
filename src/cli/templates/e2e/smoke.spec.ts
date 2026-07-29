export function smokeSpecTs(): string {
  return `import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test("smoke: home page renders and has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
`;
}
