import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  "http://localhost:3000";

setup("authenticate", async ({ page }) => {
  // Use dev-login for testing
  await page.goto(
    `${baseUrl}/dev-login?email=test@example.com&password=testpassword123`,
  );

  let authenticated = false;

  try {
    await page.waitForURL(`${baseUrl}/`, { timeout: 10000 });
    authenticated = true;
  } catch (error) {
    console.warn(
      "Auth setup did not complete, continuing without auth state.",
      error,
    );
  }

  if (authenticated) {
    await page.waitForTimeout(1000);
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
  }

  await page.context().storageState({ path: authFile });
});
