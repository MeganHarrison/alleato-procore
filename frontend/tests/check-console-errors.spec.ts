import { test } from '@playwright/test';

test('check for console errors on budget page', async ({ page }) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  // Navigate to budget page
  await page.goto('/67/budget');
  await page.waitForTimeout(3000);

  console.warn('=== CONSOLE ERRORS ===');
  errors.forEach(err => console.warn(err));

  console.warn('\n=== CONSOLE WARNINGS ===');
  warnings.forEach(warn => console.warn(warn));

  // Navigate to budget details
  await page.goto('/67/budget?tab=budget-details');
  await page.waitForTimeout(3000);

  console.warn('\n=== BUDGET DETAILS ERRORS ===');
  errors.forEach(err => console.warn(err));
});
