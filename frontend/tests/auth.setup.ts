import { test as setup } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, ".auth/user.json");
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  "http://localhost:3000";

setup("authenticate", async ({ page }) => {
  // First, check if we already have a valid auth file with cookies
  try {
    const existingAuth = JSON.parse(fs.readFileSync(authFile, "utf-8"));
    const authCookie = existingAuth.cookies?.find((c: { name: string }) =>
      c.name.includes("auth-token")
    );

    if (authCookie) {
      // Check if cookie hasn't expired (expires is in seconds since epoch)
      const now = Date.now() / 1000;
      if (authCookie.expires > now) {
        console.log("Using existing valid auth state");
        return; // Skip re-authentication
      }
    }
  } catch {
    // No existing auth file or invalid JSON, proceed with login
  }

  // Need to authenticate - use dev-login
  try {
    const response = await page.goto(
      `${baseUrl}/dev-login?email=test@example.com&password=testpassword123`,
      { waitUntil: "commit", timeout: 30000 }
    );

    if (response && response.status() >= 500) {
      throw new Error(`Server error: ${response.status()}`);
    }

    // Wait for redirects
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const cookies = await page.context().cookies();
    const authCookie = cookies.find((cookie) =>
      cookie.name.includes("auth-token"),
    );

    if (!authCookie) {
      throw new Error("Authentication failed - no auth cookie received");
    }

    console.log("Auth setup successful");
    await page.context().storageState({ path: authFile });
  } catch (error) {
    console.error("Auth setup failed:", error);
    throw error;
  }
});
