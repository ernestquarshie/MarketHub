import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

const PUBLIC_PAGES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/seller/apply",
  "/search?q=power",
  "/c/electronics",
  "/p/voltcell-20000mah-power-bank-22-5w",
  "/deals",
  "/sellers",
  "/store/volthub",
];

for (const path of PUBLIC_PAGES) {
  test(`no serious a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(
      serious,
      JSON.stringify(
        serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        null,
        2,
      ),
    ).toEqual([]);
  });
}

test("no serious a11y violations in Seller Centre and Admin", async ({ page }) => {
  for (const role of ["seller", "admin"] as const) {
    await signInAs(page, role);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
  }
});

test("keyboard: skip link moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
