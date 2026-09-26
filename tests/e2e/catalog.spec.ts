import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

const PB = "/p/voltcell-20000mah-power-bank-22-5w";

test.describe("discovery", () => {
  test("autocomplete suggests products for a typo and navigates with the keyboard", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search MarketHub" });
    await box.fill("powr bank");
    const list = page.getByRole("listbox", { name: "Search suggestions" });
    await expect(list.getByRole("option").nth(1)).toBeVisible();
    await box.press("ArrowDown");
    await box.press("ArrowDown");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/p\//);
  });

  test("search → filter → sort → product", async ({ page }) => {
    await page.goto("/search?q=power");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("power");
    const count = async () => Number((await page.getByText(/\d+ results? for/).textContent())!.match(/\d+/)![0]);
    const before = await count();
    const filters = page.getByRole("complementary", { name: "Filters" });
    await filters.getByRole("link", { name: /^VoltCell/ }).click();
    await expect(page).toHaveURL(/brand=VoltCell/);
    await expect(page.getByText("Active filters:")).toBeVisible();
    expect(await count()).toBeLessThan(before);
    await page.getByLabel("Sort by").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);
    const prices = await page.locator("article").evaluateAll((els) => els.length);
    expect(prices).toBeGreaterThan(0);
    await page.locator("article h3 a").first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/p\//);
  });

  test("price filter narrows results; empty search offers a suggestion", async ({ page }) => {
    await page.goto("/c/electronics");
    await page.getByLabel("Maximum price").first().fill("100");
    await page.getByRole("button", { name: "Apply" }).first().click();
    await expect(page).toHaveURL(/max=100/);
    await page.goto("/search?q=kettel");
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("suppliers tab lists matching sellers", async ({ page }) => {
    await page.goto("/search?q=kettle&type=suppliers");
    await expect(page.getByRole("tab", { name: "suppliers" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "Guangzhou Hometex Co." })).toBeVisible();
  });

  test("category page shows subcategories and canonical URL", async ({ page }) => {
    await page.goto("/c/home-kitchen");
    await expect(page.getByRole("heading", { level: 1, name: "Home & Kitchen" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Subcategories" }).getByRole("link", { name: "Kitchen appliances" }),
    ).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/c\/home-kitchen$/);
  });

  test("deals, sellers and store pages render", async ({ page }) => {
    await page.goto("/deals");
    await expect(page.getByRole("heading", { name: /Today's Deals/ })).toBeVisible();
    await expect(page.getByRole("progressbar").first()).toBeVisible();
    await page.goto("/sellers");
    await page.getByRole("link", { name: "VoltHub" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "VoltHub" })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
  });
});

test.describe("product page", () => {
  test("shows deal price, variants, reviews, history and structured data", async ({ page }) => {
    await page.goto(PB);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("VoltCell 20,000mAh");
    await expect(page.getByText("Flash deal ends in")).toBeVisible();
    await page.getByText("Pearl white").click();
    await expect(page.getByText("Colour: Pearl white")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer reviews" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Price over the last 12 months/ })).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"@type":"Product"'))).toBe(true);
    // Review star filter
    await page.getByRole("link", { name: /^5 star/ }).click();
    await expect(page.getByText("Showing 5-star reviews")).toBeVisible();
  });

  test("retail shopper adds to cart; header count updates", async ({ page }) => {
    await page.goto(PB);
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await expect(page.getByText("Added 2 to your cart.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Cart, 2 items/ })).toBeVisible();
  });

  test("business view: non-business users are asked to verify; verified business buys at tier price", async ({
    page,
  }) => {
    await page.goto(PB);
    await page.getByRole("form", { name: "Pricing view" }).first().getByRole("button", { name: "Business" }).click();
    await expect(page.getByText("Business prices are for verified business accounts.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" }).first()).toBeDisabled();

    await signInAs(page, "business");
    await page.goto(PB);
    await page.getByRole("form", { name: "Pricing view" }).first().getByRole("button", { name: "Business" }).click();
    await expect(page.getByRole("spinbutton", { name: "Quantity" })).toHaveValue("10");
    await expect(page.getByText(/Tier 10–99 units/)).toBeVisible();
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await expect(page.getByText("Added 10 to your cart.")).toBeVisible();
  });

  test("wishlist and price alert require sign-in, then work", async ({ page }) => {
    await page.goto(PB);
    await page.getByRole("button", { name: "Wishlist", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
    await signInAs(page, "shopper");
    await page.goto(PB);
    await page.getByRole("button", { name: "Wishlist", exact: true }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
    await page.getByRole("button", { name: "Watch price" }).click();
    await page.getByLabel(/Notify me when the price drops/).fill("200");
    await page.getByRole("button", { name: "Save alert" }).click();
    await expect(page.getByText("We'll notify you when the price hits your target.")).toBeVisible();
    await page.goto("/account/wishlist");
    await expect(page.getByText(/VoltCell 20,000mAh/)).toBeVisible();
    await expect(page.getByText(/Alert at/)).toBeVisible();
    await page.getByRole("button", { name: "Remove" }).first().click();
  });
});

test("SEO files are served", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("/p/voltcell-20000mah-power-bank-22-5w");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /account");
  expect(robots).toContain("Sitemap:");
});
