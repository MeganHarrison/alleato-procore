import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Use dev-login for testing
  await page.goto('/dev-login?email=test@example.com&password=testpassword123');

  // Wait for redirect to home page (indicates successful login)
  await page.waitForURL('/', { timeout: 10000 });

  // Wait for auth cookies to be set
  await page.waitForTimeout(1000);

  // Verify we have auth cookies before saving state
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name.includes('auth-token'));

  if (!authCookie) {
    throw new Error('Authentication failed - no auth cookie found');
  }

  console.log('Auth setup successful:', {
    cookieCount: cookies.length,
    hasAuthCookie: !!authCookie
  });

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});