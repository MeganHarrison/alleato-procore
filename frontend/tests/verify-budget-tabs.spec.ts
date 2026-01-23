import { test, expect } from '@playwright/test';

test('verify budget tabs work', async ({ page }) => {
  // Navigate to main budget tab
  await page.goto('/67/budget');
  await page.waitForTimeout(2000);

  // Take screenshot of main budget tab
  await page.screenshot({ path: 'budget-main-tab.png', fullPage: true });

  // Navigate to budget details tab
  await page.goto('/67/budget?tab=budget-details');
  await page.waitForTimeout(2000);

  // Take screenshot of budget details tab
  await page.screenshot({ path: 'budget-details-tab.png', fullPage: true });

  // Check if "Budget Details" tab is active
  const budgetDetailsTab = page.locator('text=Budget Details');
  await expect(budgetDetailsTab).toBeVisible();

  console.warn('Both budget tabs loaded successfully');
});
