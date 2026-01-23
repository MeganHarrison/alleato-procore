const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log in first
  await page.goto('http://localhost:3002/dev-login?email=test@example.com&password=testpassword123');
  await page.waitForTimeout(2000);

  // Go to companies page
  await page.goto('http://localhost:3002/directory/companies');

  // Wait longer for loading to complete
  await page.waitForTimeout(5000);

  // Check debug text after loading completes
  const debugText = await page.locator('text=Debug:').textContent();
  console.log('Debug text after loading:', debugText);

  // Check if table exists now
  const tableExists = await page.locator('table').isVisible();
  console.log('Table is visible:', tableExists);

  // Check if we have company data in the table
  const tableRows = await page.locator('tbody tr').count();
  console.log('Number of table rows:', tableRows);

  // Check for company names
  const companyName = await page.locator('text=ABC Electrical Contractors').isVisible().catch(() => false);
  console.log('Can see ABC Electrical Contractors:', companyName);

  // Check if still showing "No items found"
  const noItems = await page.locator('text=No items found').isVisible().catch(() => false);
  console.log('Still showing "No items found":', noItems);

  await browser.close();
})();