const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Logging in...');
  await page.goto('http://localhost:3002/dev-login?email=test@example.com&password=testpassword123');
  await page.waitForTimeout(2000);

  console.log('2. Going to companies page...');
  await page.goto('http://localhost:3002/directory/companies');
  await page.waitForTimeout(3000);

  // Take a screenshot
  await page.screenshot({ path: 'companies-page.png' });
  console.log('3. Screenshot saved as companies-page.png');

  // Check what's visible
  const noItemsVisible = await page.locator('text=/No items found/i').isVisible();
  console.log('4. "No items found" visible?', noItemsVisible);

  // Check table rows
  const tableRows = await page.locator('tbody tr').count();
  console.log('5. Number of table rows:', tableRows);

  // Check if any company names are visible
  const companyNamesVisible = await page.locator('text="ABC Electrical Contractors"').count();
  console.log('6. Can see "ABC Electrical Contractors"?', companyNamesVisible > 0);

  // Check what's in the first table cell
  try {
    const firstCell = await page.locator('tbody td').first().textContent();
    console.log('7. First table cell content:', firstCell);
  } catch (e) {
    console.log('7. No table cells found');
  }

  // Check the actual table structure
  const tableHTML = await page.locator('table').innerHTML();
  console.log('8. Table has content?', tableHTML.length > 100);

  // Check if loading spinner is gone
  const loadingSpinner = await page.locator('[role="status"]').count();
  console.log('9. Loading spinners found:', loadingSpinner);

  // Get console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  // Check the API directly
  const apiData = await page.evaluate(async () => {
    const response = await fetch('/api/directory/companies?status=all&sort=name&page=1&per_page=50', {
      credentials: 'include'
    });
    const data = await response.json();
    return {
      status: response.status,
      dataLength: data.data ? data.data.length : 0,
      error: data.error,
      firstCompany: data.data && data.data[0] ? data.data[0] : null
    };
  });
  console.log('10. API check:', apiData);

  // Check what React components have
  const componentData = await page.evaluate(() => {
    // Find all React fiber nodes
    const findReactFiber = (element) => {
      for (const key in element) {
        if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
          return element[key];
        }
      }
      return null;
    };

    // Try to find the table component
    const table = document.querySelector('table');
    if (table) {
      const fiber = findReactFiber(table);
      console.log('Found fiber:', fiber);
    }

    // Check if companies prop exists in window or any global
    return {
      hasTable: !!document.querySelector('table'),
      tableRows: document.querySelectorAll('tbody tr').length,
      hasNoItemsText: !!document.querySelector('text=/No items found/i')
    };
  });
  console.log('11. Component check:', componentData);

  await page.waitForTimeout(2000);
  await browser.close();
})();