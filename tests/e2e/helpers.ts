import { expect, type Page } from "@playwright/test";

export type DemoRole = "shopper" | "business" | "seller" | "admin";

const LABEL: Record<DemoRole, string> = {
  shopper: "Shopper",
  business: "Business buyer",
  seller: "Seller",
  admin: "Admin",
};

/** Sign in through the demo "Try as…" switcher in the top bar. */
export async function signInAs(page: Page, role: DemoRole) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try as…" }).click();
  await page.getByRole("menuitem", { name: new RegExp(`^${LABEL[role]}`) }).click();
  await page.waitForLoadState("networkidle");
}

export async function signOut(page: Page) {
  await page.context().clearCookies();
}

export async function expectForbidden(page: Page, path: string) {
  const res = await page.goto(path);
  expect(res?.status()).toBe(403);
  await expect(page.getByRole("heading", { name: "You don't have access to this page" })).toBeVisible();
}
