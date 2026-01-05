import { test } from '@playwright/test';

test('verify scrollbar on budget page', async ({ page }) => {
  // Navigate to the budget page
  await page.goto('http://localhost:3003/67/budget');

  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({
    path: 'tests/screenshots/budget-scrollbar-check.png',
    fullPage: true
  });

  // Find all elements with overflow-auto class
  const scrollContainers = await page.locator('.overflow-auto').all();

  console.log(`\n=== SCROLLBAR CHECK ===`);
  console.log(`Found ${scrollContainers.length} elements with overflow-auto`);

  for (let i = 0; i < scrollContainers.length; i++) {
    const container = scrollContainers[i];

    // Get the class attribute
    const className = await container.getAttribute('class');
    console.log(`\nContainer ${i + 1}:`);
    console.log(`Classes: ${className}`);

    // Check if it has scrollbar-hide
    const hasScrollbarHide = className?.includes('scrollbar-hide');
    console.log(`Has scrollbar-hide: ${hasScrollbarHide}`);

    // Get computed styles
    const styles = await container.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflow: computed.overflow,
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
      };
    });
    console.log(`Computed styles:`, styles);
  }

  // Look specifically for the budget table container
  const budgetTableContainer = page.locator('.flex-1.overflow-auto').first();
  const exists = await budgetTableContainer.count();

  if (exists > 0) {
    const classes = await budgetTableContainer.getAttribute('class');
    console.log(`\n=== BUDGET TABLE CONTAINER ===`);
    console.log(`Classes: ${classes}`);
    console.log(`Has scrollbar-hide: ${classes?.includes('scrollbar-hide')}`);
  } else {
    console.log(`\nBudget table container not found`);
  }
});
