import { test, expect } from "@playwright/test";

test.describe("TravelAI smoke", () => {
  test("home redirects to locale and shows brand", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(vi|en)/);
    await expect(page.getByText("TravelAI").first()).toBeVisible();
  });

  test("explore and hotels routes render shell", async ({ page }) => {
    await page.goto("/vi/explore");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await page.goto("/vi/hotels");
    await expect(page.getByTestId("content-ready")).toBeVisible();
  });

  test("ai planner page loads", async ({ page }) => {
    await page.goto("/vi/ai");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await expect(page.getByText(/TravelAI Concierge|Concierge/i).first()).toBeVisible();
  });

  test("login page has form", async ({ page }) => {
    await page.goto("/vi/login");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
