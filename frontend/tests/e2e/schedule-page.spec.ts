import { test, expect } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  "http://localhost:3000";

test.describe("Schedule Page", () => {
  test("loads schedule table and headers", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`${baseUrl}/67/schedule`, {
      waitUntil: "domcontentloaded",
    });

    const heading = page.getByRole("heading", { name: "Schedule" }).first();
    await expect(heading).toBeVisible();

    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    await expect(page.getByRole("columnheader", { name: "Task" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Start" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Finish" })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
