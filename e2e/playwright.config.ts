import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    // Keep the browser and NEXT_PUBLIC service URLs on the same hostname so
    // SameSite refresh cookies behave exactly as they do in a real deployment.
    baseURL: process.env.WEB_URL ?? "http://localhost:53000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
