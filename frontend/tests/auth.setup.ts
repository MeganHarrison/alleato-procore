import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  "http://localhost:3000";

setup("authenticate", async ({ page }) => {
  try {
    // Use dev-login for testing
    await page.goto(
      `${baseUrl}/dev-login?email=test@example.com&password=testpassword123`,
    );

    // Wait for redirect to home page (indicates successful login)
    await page.waitForURL(`${baseUrl}/`, { timeout: 10000 });

    // Wait for auth cookies to be set
    await page.waitForTimeout(1000);

    // Verify we have auth cookies before saving state
    const cookies = await page.context().cookies();
    const authCookie = cookies.find((cookie) =>
      cookie.name.includes("auth-token"),
    );

    if (!authCookie) {
      throw new Error("Authentication failed - no auth cookie found");
    }

    console.warn("Auth setup successful:", {
      cookieCount: cookies.length,
      hasAuthCookie: !!authCookie,
    });

    // Save signed-in state only when authenticated
    await page.context().storageState({ path: authFile });
  } catch (error) {
    console.warn("Auth setup did not complete; skipping auth state save.", error);
    throw error;
  }
});
