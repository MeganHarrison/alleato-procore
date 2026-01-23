import { test, expect } from '@playwright/test';

test('Check cost codes status values', async ({ page }) => {
  // Navigate to the budget line item new page
  await page.goto('/98/budget/line-item/new');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Click the budget code dropdown to trigger the popover
  await page.getByRole('button', { name: /select budget code/i }).first().click();

  // Click on "Create New Budget Code" to open the modal
  await page.getByText('Create New Budget Code').click();

  // Wait for the modal to open and cost codes to load
  await page.waitForSelector('text=Create New Budget Code', { state: 'visible' });

  // Wait a moment for cost codes to load
  await page.waitForTimeout(2000);

  // Check if any divisions are visible
  const divisions = await page.locator('button').filter({ hasText: /Division/i }).count();
  console.log('Number of divisions found:', divisions);

  // Try to expand the first division if any exist
  if (divisions > 0) {
    await page.locator('button').filter({ hasText: /Division/i }).first().click();
    await page.waitForTimeout(1000);

    // Count cost codes
    const costCodes = await page.locator('button[type="button"]').filter({ hasText: /^\d+/ }).count();
    console.log('Number of cost codes found:', costCodes);
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'cost-codes-modal.png', fullPage: true });
});