import { test, expect } from '@playwright/test';

test('debug budget details tab', async ({ page }) => {
  // Navigate to budget details tab
  await page.goto('http://localhost:3004/67/budget?tab=budget-details');

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'budget-details-debug.png', fullPage: true });

  // Get console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a bit more to capture any errors
  await page.waitForTimeout(2000);

  // Log errors
  console.warn('Console errors:', errors);

  // Check if there's any error text on the page
  const bodyText = await page.textContent('body');
  console.warn('Page body text:', bodyText?.substring(0, 500));
});
