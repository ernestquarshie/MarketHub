import { expect, test } from "@playwright/test";

// Runs in the "mobile" project (375px wide).
test("mobile: no horizontal scroll, menu opens, search visible", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("search")).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Shop by category" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Today's Deals" })).toBeVisible();
});
