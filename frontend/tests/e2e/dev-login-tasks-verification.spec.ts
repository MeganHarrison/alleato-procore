import { test, expect } from '@playwright/test';

test.describe('Dev Login - Tasks Page Verification', () => {
  test('should authenticate via dev login and verify tasks page renders correctly', async ({ page }) => {
    // Navigate to dev login endpoint
    await page.goto('http://localhost:3000/dev-login?email=test@example.com&password=testpassword123');

    // Wait for authentication to complete (redirect or confirmation)
    await page.waitForTimeout(2000);

    // Take screenshot after dev login
    await page.screenshot({ path: 'tests/screenshots/dev-login-complete.png', fullPage: true });

    // Navigate to tasks page
    await page.goto('http://localhost:3000/tasks');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take full page screenshot
    await page.screenshot({ path: 'tests/screenshots/tasks-page-full.png', fullPage: true });

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Reload to catch any console errors
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if page title is correct
    const title = await page.title();
    console.log('Page Title:', title);

    // Check for PageContainer presence
    const pageContainer = page.locator('[class*="PageContainer"], [data-testid="page-container"]');
    const hasPageContainer = await pageContainer.count() > 0;
    console.log('Has PageContainer:', hasPageContainer);

    // Check for task elements
    const taskElements = page.locator('[data-testid*="task"], [class*="task"], table tbody tr, [role="row"]');
    const taskCount = await taskElements.count();
    console.log('Task elements found:', taskCount);

    // Check for main heading
    const heading = page.locator('h1, h2').first();
    const headingText = await heading.textContent().catch(() => 'No heading found');
    console.log('Page Heading:', headingText);

    // Check for empty state
    const emptyState = page.locator('[class*="empty"], [data-testid="empty-state"]');
    const hasEmptyState = await emptyState.count() > 0;
    console.log('Has Empty State:', hasEmptyState);

    // Take final screenshot with annotations
    await page.screenshot({ path: 'tests/screenshots/tasks-page-final.png', fullPage: true });

    // Log console errors if any
    if (consoleErrors.length > 0) {
      console.log('Console Errors Found:');
      consoleErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('No console errors detected');
    }

    // Basic assertions
    expect(page.url()).toContain('/tasks');
  });
});
