import { expect, test } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("home page renders header, categories and products", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MarketHub/);
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Electronics" }).first()).toBeVisible();
    const cards = page.locator("article");
    expect(await cards.count()).toBeGreaterThanOrEqual(8);
    await expect(page.getByText("Payments run in test mode")).toBeVisible();
  });

  test("currency switcher converts prices and persists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("article").first()).toContainText("GHS");
    await page.getByRole("form", { name: "Currency" }).first().getByRole("button", { name: "USD" }).click();
    await expect(page.locator("article").first()).toContainText("$");
    await page.reload();
    await expect(
      page.getByRole("form", { name: "Currency" }).first().getByRole("button", { name: "USD" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("business view shows tier prices and MOQ", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("form", { name: "Pricing view" }).first().getByRole("button", { name: "Business" }).click();
    await expect(page.getByText("Showing business prices")).toBeVisible();
    await expect(page.getByText(/MOQ \d+/).first()).toBeVisible();
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });
});
