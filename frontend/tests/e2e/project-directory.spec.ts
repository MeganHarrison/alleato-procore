import { test } from '@playwright/test';

test.describe('Project Directory Page', () => {
  test('should load and display directory correctly', async ({ page }) => {
    // Set up console error listener BEFORE navigation
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Set up network listener BEFORE navigation
    const failedRequests: Array<{ method: string; url: string; error: string; status?: number }> = [];
    const apiRequests: Array<{ method: string; url: string; status: number }> = [];

    page.on('requestfailed', request => {
      failedRequests.push({
        method: request.method(),
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown error'
      });
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          method: response.request().method(),
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Navigate to project directory
    await page.goto('http://localhost:3003/67/directory');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait a bit more for React to render
    await page.waitForTimeout(3000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'tests/screenshots/directory-initial.png',
      fullPage: true
    });

    // Log all captured errors and requests
    console.log('\n=== API REQUESTS ===');
    apiRequests.forEach(req => {
      console.log(`${req.method} ${req.url} - ${req.status}`);
    });

    if (failedRequests.length > 0) {
      console.log('\n=== FAILED REQUESTS ===');
      failedRequests.forEach(req => {
        console.error(`${req.method} ${req.url} - ${req.error}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => {
        console.error(err);
      });
    }

    // Check for error messages in DOM
    const errorElements = await page.locator('[role="alert"], .error, [class*="error"], .text-destructive').all();
    if (errorElements.length > 0) {
      console.log('\n=== ERROR ELEMENTS IN DOM ===');
      for (const el of errorElements) {
        const text = await el.textContent();
        console.error('Error element:', text);
      }
    }

    // Check what's actually rendered
    const bodyText = await page.locator('body').textContent();
    console.log('\n=== PAGE CONTENT PREVIEW ===');
    console.log(bodyText?.substring(0, 1000));

    // Check for loading states
    const loadingElements = await page.locator('[class*="loading"], [class*="spinner"]').count();
    console.log('\n=== LOADING ELEMENTS ===', loadingElements);

    // Check for directory-specific content
    const directoryContent = await page.locator('[data-testid*="directory"], [class*="directory"]').count();
    console.log('=== DIRECTORY ELEMENTS ===', directoryContent);

    // Check for table content
    const tableRows = await page.locator('table tbody tr').count();
    console.log('=== TABLE ROWS ===', tableRows);
  });
});
