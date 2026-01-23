const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log in first
  console.log('Logging in...');
  await page.goto('http://localhost:3002/dev-login?email=test@example.com&password=testpassword123');
  await page.waitForTimeout(2000);

  // Go to companies page
  console.log('Going to companies page...');
  await page.goto('http://localhost:3002/directory/companies');
  await page.waitForTimeout(3000);

  // Inject debugging into React components
  await page.evaluate(() => {
    // Override console.log to capture component logs
    const originalLog = console.log;
    window.debugLogs = [];
    console.log = (...args) => {
      window.debugLogs.push(args);
      originalLog(...args);
    };
  });

  // Force a re-render with logging
  await page.evaluate(() => {
    // Find the React component root
    const root = document.querySelector('#__next');
    if (root && root._reactRootContainer) {
      console.log('Found React root');
    }
  });

  // Check what's in the DOM
  const domInfo = await page.evaluate(() => {
    const table = document.querySelector('table');
    const tbody = document.querySelector('tbody');
    const rows = document.querySelectorAll('tbody tr');
    const cells = document.querySelectorAll('tbody td');

    return {
      hasTable: !!table,
      hasTbody: !!tbody,
      rowCount: rows.length,
      cellCount: cells.length,
      firstRowHTML: rows[0]?.innerHTML || 'No rows',
      firstCellText: cells[0]?.textContent || 'No cells',
      allCellTexts: Array.from(cells).map(c => c.textContent)
    };
  });
  console.log('DOM Info:', domInfo);

  // Try to access the API directly and see what we get
  const apiResponse = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/directory/companies?status=all&sort=name&page=1&per_page=50', {
        credentials: 'include'
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return { error: 'Not JSON', text: text.substring(0, 200) };
      }
      return {
        status: response.status,
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        firstItem: data.data?.[0] || null,
        allFields: data.data?.[0] ? Object.keys(data.data[0]) : []
      };
    } catch (err) {
      return { error: err.message };
    }
  });
  console.log('API Response:', JSON.stringify(apiResponse, null, 2));

  await page.screenshot({ path: 'companies-debug.png' });
  console.log('Screenshot saved as companies-debug.png');

  await browser.close();
})();