import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('check scrollbar HTML classes', async ({ page }) => {
  // Navigate directly - we just want to see what's rendered
  await page.goto('http://localhost:3003/67/budget', { waitUntil: 'domcontentloaded' });

  // Wait a bit for any client-side rendering
  await page.waitForTimeout(3000);

  // Take screenshot to see what we're working with
  await page.screenshot({
    path: 'tests/screenshots/budget-page-state.png',
    fullPage: false
  });

  // Get all the HTML to inspect
  const html = await page.content();

  console.log(`\n=== CHECKING FOR SCROLLBAR-HIDE CLASS ===`);

  // Check if scrollbar-hide appears anywhere in the HTML
  const hasScrollbarHideInHTML = html.includes('scrollbar-hide');
  console.log(`scrollbar-hide found in HTML: ${hasScrollbarHideInHTML}`);

  // Count occurrences
  const matches = html.match(/scrollbar-hide/g);
  console.log(`Number of occurrences: ${matches ? matches.length : 0}`);

  // Try to find the specific div we're looking for
  const divWithBothClasses = await page.locator('div.overflow-auto.scrollbar-hide').count();
  console.log(`\nDivs with both overflow-auto AND scrollbar-hide: ${divWithBothClasses}`);

  // Check if the CSS is loaded
  const cssHasScrollbarHide = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule && rule.selectorText?.includes('scrollbar-hide')) {
            return true;
          }
        }
      } catch (e) {
        // Skip sheets we can't access
      }
    }
    return false;
  });
  console.log(`\nCSS contains .scrollbar-hide rule: ${cssHasScrollbarHide}`);

  // Log the actual class names on overflow-auto elements
  const overflowElements = await page.locator('.overflow-auto').all();
  console.log(`\n=== FOUND ${overflowElements.length} ELEMENTS WITH .overflow-auto ===`);

  for (let i = 0; i < Math.min(overflowElements.length, 5); i++) {
    const classes = await overflowElements[i].getAttribute('class');
    console.log(`Element ${i + 1} classes: ${classes}`);
  }
});
