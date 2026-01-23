const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('Console:', text);
  });

  // Log in first
  console.log('\n=== Logging in ===');
  await page.goto('http://localhost:3002/dev-login?email=test@example.com&password=testpassword123');
  await page.waitForTimeout(2000);

  // Try both URLs
  console.log('\n=== Testing project-scoped URL first ===');
  await page.goto('http://localhost:3002/1/directory/companies');
  await page.waitForTimeout(3000);

  console.log('\n=== Now testing global URL ===');
  await page.goto('http://localhost:3002/directory/companies');
  await page.waitForTimeout(3000);

  // Print all captured logs
  console.log('\n=== All console logs from the page ===');
  logs.forEach((log, i) => {
    console.log(`${i + 1}. ${log}`);
  });

  // Check what's visible
  const pageInfo = await page.evaluate(() => {
    const table = document.querySelector('table');
    const rows = document.querySelectorAll('tbody tr');
    const cells = document.querySelectorAll('tbody td');

    return {
      hasTable: !!table,
      rowCount: rows.length,
      firstCellText: cells[0]?.textContent || 'No cells',
      url: window.location.href
    };
  });

  console.log('\n=== Page Info ===');
  console.log(pageInfo);

  await browser.close();
})();