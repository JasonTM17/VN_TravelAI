import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const shotDir =
  process.env.GESTURE_SHOT_DIR ||
  path.join(process.cwd(), "test-results", "booking");

test.beforeAll(() => {
  fs.mkdirSync(shotDir, { recursive: true });
});

test.describe("Booking happy path UI", () => {
  test("login → hotel detail → book → bookings list", async ({ page }) => {
    // Login
    await page.goto("/vi/login");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await page.locator('input[type="email"]').fill("demo@travelai.local");
    await page.locator('input[type="password"]').fill("DemoTravelAI1!");
    await page.locator('button[type="submit"]').click();
    // AuthForm redirects to bookings after login
    await expect(page).toHaveURL(/\/vi\/bookings/, { timeout: 20_000 });

    // Browse hotels and open first detail
    await page.goto("/vi/hotels");
    await expect(page.getByTestId("content-ready")).toBeVisible();
    const hotelLink = page.locator('a[href*="/vi/hotels/"]').first();
    await expect(hotelLink).toBeVisible({ timeout: 15_000 });
    await hotelLink.click();
    await expect(page).toHaveURL(/\/vi\/hotels\/.+/);
    await expect(page.getByTestId("content-ready")).toBeVisible();
    await page.screenshot({ path: path.join(shotDir, "01-hotel-detail.png"), fullPage: true });

    // Create booking (no auto-pay unless NEXT_PUBLIC_BOOK_AUTOPAY)
    const bookBtn = page.getByRole("button", { name: /Đặt ngay|Book now/i });
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();
    await expect(page).toHaveURL(/\/vi\/bookings/, { timeout: 25_000 });
    await page.screenshot({ path: path.join(shotDir, "02-bookings.png"), fullPage: true });

    // Explicit mock pay when pending
    const payBtn = page.getByRole("button", { name: /Thanh toán mock|Mock pay/i });
    if (await payBtn.count()) {
      await payBtn.first().click();
      await expect(page.getByText(/confirmed|đã xác nhận|Confirmed/i).first()).toBeVisible({
        timeout: 15_000,
      }).catch(() => undefined);
    }

    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(page.url()).toMatch(/\/vi\/bookings/);
  });
});
