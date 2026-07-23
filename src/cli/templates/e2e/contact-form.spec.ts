export function contactFormSpecTs(): string {
  return `import { test, expect } from "@playwright/test";

test("contact form shows confirmation on success", async ({ page }) => {
  await page.route("**/api/contact", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto("/contact");
  await page.fill('[name="name"]', "Ada Lovelace");
  await page.fill('[name="email"]', "ada@example.com");
  await page.fill('[name="message"]', "This is a long enough test message.");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Message sent.")).toBeVisible();
});

test("contact form shows error message on submission failure", async ({ page }) => {
  await page.route("**/api/contact", async (route) => {
    await route.fulfill({ status: 500, body: "Internal Server Error" });
  });
  await page.goto("/contact");
  await page.fill('[name="name"]', "Ada Lovelace");
  await page.fill('[name="email"]', "ada@example.com");
  await page.fill('[name="message"]', "This is a long enough test message.");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Something went wrong. Please try again.")).toBeVisible();
});
`;
}
