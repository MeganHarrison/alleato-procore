import { test } from '@playwright/test';

test('capture actual budget details error', async ({ page }) => {
  const allConsoleMessages: Array<{ type: string; text: string }> = [];

  // Capture ALL console messages
  page.on('console', msg => {
    allConsoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Capture page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.warn('Navigating to budget details...');
  await page.goto('http://localhost:3004/67/budget?tab=budget-details');

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'budget-details-current-state.png', fullPage: true });

  console.warn('\n=== ALL CONSOLE MESSAGES ===');
  allConsoleMessages.forEach(msg => {
    console.warn(`[${msg.type}] ${msg.text}`);
  });

  console.warn('\n=== PAGE ERRORS ===');
  pageErrors.forEach(err => {
    console.warn(err);
  });

  // Check the page content
  const bodyText = await page.textContent('body');
  console.warn('\n=== PAGE CONTENT (first 1000 chars) ===');
  console.warn(bodyText?.substring(0, 1000));
});
