import { test, expect } from "@playwright/test";

/**
 * Real-app auth flow: register → change password → old fails → new works.
 * Uses unique email per run. Runs against local overlay ports by default.
 */
const WEB = process.env.BASE_WEB ?? "http://localhost:53000";
const IDENTITY = process.env.BASE_IDENTITY ?? "http://localhost:53002";

test.describe("auth register + change password", () => {
  test("API: register, change password, re-login", async ({ request }) => {
    const email = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@travelai.test`;
    const oldPass = "OldPass123!";
    const newPass = "NewPass456!";

    const reg = await request.post(`${IDENTITY}/v1/auth/register`, {
      data: { email, password: oldPass, fullName: "E2E User" },
    });
    expect(reg.status()).toBe(201);
    const regBody = await reg.json();
    const token = regBody.data.accessToken as string;
    expect(token.length).toBeGreaterThan(20);

    const bad = await request.post(`${IDENTITY}/v1/auth/change-password`, {
      headers: { authorization: `Bearer ${token}` },
      data: { currentPassword: "wrong-old-pass", newPassword: newPass },
    });
    expect(bad.status()).toBe(401);

    const ch = await request.post(`${IDENTITY}/v1/auth/change-password`, {
      headers: { authorization: `Bearer ${token}` },
      data: { currentPassword: oldPass, newPassword: newPass },
    });
    expect(ch.status()).toBe(200);
    const chBody = await ch.json();
    expect(chBody.data.changed).toBe(true);

    const oldLogin = await request.post(`${IDENTITY}/v1/auth/login`, {
      data: { email, password: oldPass },
    });
    expect(oldLogin.status()).toBe(401);

    const newLogin = await request.post(`${IDENTITY}/v1/auth/login`, {
      data: { email, password: newPass },
    });
    expect(newLogin.status()).toBe(200);
    const nl = await newLogin.json();
    expect(nl.data.accessToken).toBeTruthy();
  });

  test("UI: register page + account change password form", async ({ page }) => {
    const email = `ui_${Date.now()}@travelai.test`;
    const oldPass = "UiOldPass1!";
    const newPass = "UiNewPass2!";

    await page.goto(`${WEB}/vi/register`);
    await expect(page.getByTestId("auth-form")).toBeVisible();
    const inputs = page.locator("form[data-testid=auth-form] input");
    await inputs.nth(0).fill("UI Test User");
    await inputs.nth(1).fill(email);
    await inputs.nth(2).fill(oldPass);
    await page.locator('form[data-testid=auth-form] button[type="submit"]').click();
    // Must leave /register (loose /vi/ matches the register URL too)
    await page.waitForURL(/\/vi\/bookings/, { timeout: 20000 });
    // Access token is in-memory by default; cookie holds refresh — assert authed UI instead of storage
    await expect(page).toHaveURL(/\/vi\/bookings/);

    await page.goto(`${WEB}/vi/account`);
    await expect(page.getByTestId("change-password-form")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("current-password").fill(oldPass);
    await page.getByTestId("new-password").fill(newPass);
    await page.getByTestId("confirm-password").fill(newPass);
    await page.locator('form[data-testid=change-password-form] button[type="submit"]').click();
    await expect(page.getByTestId("change-password-ok")).toBeVisible({ timeout: 20000 });

    // Login with new password via CTA
    await page.getByTestId("change-password-relogin").click();
    await page.waitForURL(/\/vi\/login/, { timeout: 15000 });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(newPass);
    await page.locator('form[data-testid=auth-form] button[type="submit"]').click();
    await page.waitForURL(/\/vi\/(bookings|account|hotels)?$/, { timeout: 20000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});

