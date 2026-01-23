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
  await page.waitForTimeout(3000);

  // Look for our debug text
  const debugText = await page.locator('text=Debug:').textContent().catch(() => null);
  console.log('Debug text:', debugText);

  // Check if page content exists
  const pageContent = await page.textContent('body');
  console.log('Page contains "Debug":', pageContent.includes('Debug'));
  console.log('Page contains "companies":', pageContent.includes('companies'));
  console.log('Page contains "Company Directory":', pageContent.includes('Company Directory'));

  await browser.close();
})();