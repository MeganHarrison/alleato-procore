const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log in
  await page.goto('http://localhost:3002/dev-login?email=test@example.com&password=testpassword123');
  await page.waitForTimeout(2000);

  // Go to companies page
  await page.goto('http://localhost:3002/directory/companies');

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Check if page header loads
  const title = await page.locator('text=Company Directory').isVisible();
  console.log('✓ Company Directory title visible:', title);

  // Check if tabs are present
  const tabs = await page.locator('[role="tablist"]').isVisible();
  console.log('✓ Directory tabs visible:', tabs);

  // Check if table is present
  const table = await page.locator('table').isVisible();
  console.log('✓ Table component visible:', table);

  // Check for any companies or loading state
  const loading = await page.locator('text=Loading').isVisible();
  const noItems = await page.locator('text=No items found').isVisible();
  console.log('Loading state:', loading);
  console.log('No items message:', noItems);

  // Take a screenshot
  await page.screenshot({ path: 'companies-final.png' });
  console.log('✓ Screenshot saved as companies-final.png');

  await browser.close();
})();