import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const shotDir =
  process.env.GESTURE_SHOT_DIR ||
  path.join(process.cwd(), "test-results", "gestures");

test.beforeAll(() => {
  fs.mkdirSync(shotDir, { recursive: true });
});

test.describe("A→Z critical gestures", () => {
  test("home shows catalog grids when API seeded", async ({ page }) => {
    await page.goto("/vi");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await expect(page.getByText("TravelAI").first()).toBeVisible();
    // Product discovery icons
    await expect(page.getByRole("link", { name: /Khách sạn|Hotels/i }).first()).toBeVisible();
    // When API is up, hotel cards should exist (not only empty state)
    const hotelCards = page.getByTestId("hotel-card");
    const tourCards = page.getByTestId("tour-card");
    await expect(hotelCards.first()).toBeVisible({ timeout: 15_000 });
    await expect(tourCards.first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: path.join(shotDir, "01-home.png"), fullPage: true });
  });

  test("hotels list → detail", async ({ page }) => {
    await page.goto("/vi/hotels");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    const first = page.locator('a[href*="/vi/hotels/"]').first();
    await expect(first).toBeVisible({ timeout: 15_000 });
    await first.click();
    await expect(page).toHaveURL(/\/vi\/hotels\/.+/);
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, "02-hotel-detail.png"), fullPage: true });
  });

  test("tours list → detail", async ({ page }) => {
    await page.goto("/vi/tours");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    const first = page.locator('a[href*="/vi/tours/"]').first();
    await expect(first).toBeVisible({ timeout: 15_000 });
    await first.click();
    await expect(page).toHaveURL(/\/vi\/tours\/.+/);
    await page.screenshot({ path: path.join(shotDir, "03-tour-detail.png"), fullPage: true });
  });

  test("flights page loads search shell", async ({ page }) => {
    await page.goto("/vi/flights");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, "04-flights.png"), fullPage: true });
  });

  test("chatbot FAB open + chips visible", async ({ page }) => {
    await page.goto("/vi");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    const chatBtn = page.getByRole("button", { name: /Chat|Mở chat/i });
    await expect(chatBtn).toBeVisible();
    await chatBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Concierge/i).first()).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, "05-chatbot.png") });
  });

  test("login form interaction", async ({ page }) => {
    await page.goto("/vi/login");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    const email = page.locator('input[type="email"]');
    const password = page.locator('input[type="password"]');
    await expect(email).toBeVisible();
    await email.fill("demo@travelai.local");
    await password.fill("DemoTravelAI1!");
    await page.screenshot({ path: path.join(shotDir, "06-login.png") });
  });

  test("ai planner page", async ({ page }) => {
    await page.goto("/vi/ai");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await expect(page.getByText(/Concierge|TravelAI/i).first()).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, "07-ai.png"), fullPage: true });
  });
});
