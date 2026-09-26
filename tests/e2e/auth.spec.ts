import { expect, test } from "@playwright/test";
import { expectForbidden, signInAs } from "./helpers";

test.describe("authentication", () => {
  test("signed-out visitors are sent to login with a return path", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Forders/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("register, then sign out and sign back in", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Test Buyer");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Passw0rd!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("button", { name: /Hello, Test/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("That email and password don't match an account.")).toBeVisible();

    await page.getByLabel("Password").fill("Passw0rd!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
  });

  test("registration validates input", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("A");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
  });

  test("login ignores off-site ?next= redirects", async ({ page }) => {
    await page.goto("/login?next=//evil.example.com");
    await page.getByLabel("Email").fill("shopper@demo.markethub.test");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/localhost:\d+\/account$/);
  });
});

test.describe("role guards", () => {
  test("shopper can use the account area but not seller or admin", async ({ page }) => {
    await signInAs(page, "shopper");
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
    await expectForbidden(page, "/seller");
    await expectForbidden(page, "/admin");
    await expectForbidden(page, "/admin/users");
  });

  test("business buyer sees the verified business badge", async ({ page }) => {
    await signInAs(page, "business");
    await page.goto("/account");
    await expect(page.getByText("Verified business")).toBeVisible();
  });

  test("seller reaches Seller Centre but not admin", async ({ page }) => {
    await signInAs(page, "seller");
    await expect(page).toHaveURL(/\/seller$/);
    await expect(page.getByRole("heading", { name: "VoltHub" })).toBeVisible();
    await expectForbidden(page, "/admin");
  });

  test("admin reaches the admin overview but not Seller Centre", async ({ page }) => {
    await signInAs(page, "admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Seller applications")).toBeVisible();
    await expectForbidden(page, "/seller");
  });
});
