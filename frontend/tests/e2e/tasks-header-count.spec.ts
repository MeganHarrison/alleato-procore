import { test } from '@playwright/test';

test('tasks header count check', async ({ page }) => {
  await page.goto('http://localhost:3000/dev-login?email=test@example.com&password=testpassword123');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:3000/tasks');
  await page.waitForTimeout(3000);

  // Count all header elements
  const allHeaders = await page.locator('header').all();
  console.log(`\n=== TOTAL HEADERS: ${allHeaders.length} ===\n`);

  for (let i = 0; i < allHeaders.length; i++) {
    const header = allHeaders[i];
    const isVisible = await header.isVisible();
    const text = await header.textContent();
    console.log(`Header ${i + 1}:`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Text: ${text?.substring(0, 100)}...`);
    console.log('');
  }

  await page.screenshot({
    path: 'tests/screenshots/tasks-header-check.png',
    fullPage: true
  });
});
