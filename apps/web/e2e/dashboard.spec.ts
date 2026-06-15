import { expect, test } from "@playwright/test";

test.describe("Overview dashboard", () => {
  test("renders the four summary stat cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CPU Usage")).toBeVisible();
    await expect(page.getByText("Memory Usage")).toBeVisible();
    await expect(page.getByText("API P95 Latency")).toBeVisible();
    await expect(page.getByText("Revenue Today")).toBeVisible();
  });

  test("SSE connects and the live indicator turns green", async ({ page }) => {
    await page.goto("/");
    const indicator = page.getByTestId("live-indicator");
    await expect(indicator).toBeVisible();
    // Once the stream opens, the indicator reports "Live" (healthy green).
    await expect(indicator).toContainText("Live", { timeout: 15_000 });
  });

  test("stat values populate from the stream (not the em-dash placeholder)", async ({ page }) => {
    await page.goto("/");
    // The CPU gauge renders a percentage once data arrives.
    await expect(page.locator("text=/^\\d+%$/").first()).toBeVisible({ timeout: 15_000 });
  });

  test("navigates to the system, api-health, and business pages", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "System" }).click();
    await expect(page.getByRole("heading", { name: "System" })).toBeVisible();

    await page.getByRole("link", { name: "API Health" }).click();
    await expect(page.getByRole("heading", { name: "API Health" })).toBeVisible();

    await page.getByRole("link", { name: "Business" }).click();
    await expect(page.getByRole("heading", { name: "Business" })).toBeVisible();
  });
});
