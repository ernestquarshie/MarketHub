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

test("mobile: product page has a sticky add-to-cart bar and no overflow", async ({ page }) => {
  await page.goto("/p/voltcell-20000mah-power-bank-22-5w");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("button", { name: "Add to cart" }).last()).toBeVisible();
});

test("mobile: search filters open in a sheet", async ({ page }) => {
  await page.goto("/search?q=power");
  await page.getByRole("button", { name: /^Filters/ }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
});
