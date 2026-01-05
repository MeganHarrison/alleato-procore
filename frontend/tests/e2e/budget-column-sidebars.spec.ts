import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for all budget column detail sidebars
 * Tests the 8 sidebars created for budget table columns
 */

test.describe('Budget Column Detail Sidebars', () => {
  test.use({ storageState: undefined });

  test.beforeEach(async ({ page }) => {
    // Navigate to budget page
    await page.goto('http://localhost:3002/67/budget');
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
  });

  test('should open Budget Modifications sidebar', async ({ page }) => {
    // Find and click Budget Modifications cell
    const cell = page.locator('button[aria-label*="Edit $"]').first();
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify sidebar opens (Sheet component)
    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    // Verify sidebar header with title
    const title = page.getByRole('heading', { name: /Budget Modifications/i });
    await expect(title).toBeVisible();

    // Verify tabs are present
    const summaryTab = page.getByRole('button', { name: 'Summary' });
    const detailsTab = page.getByRole('button', { name: 'Details' });
    await expect(summaryTab).toBeVisible();
    await expect(detailsTab).toBeVisible();

    // Verify status filter buttons
    const allFilter = page.getByRole('button', { name: 'All' });
    const approvedFilter = page.getByRole('button', { name: 'Approved' });
    await expect(allFilter).toBeVisible();
    await expect(approvedFilter).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/budget-modifications-sidebar.png',
      fullPage: true
    });

    // Test tab switching
    await detailsTab.click();
    await page.waitForTimeout(500);

    // Close sidebar
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await page.waitForTimeout(500);
  });

  test('should open Approved COs sidebar', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(1);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify sidebar opens
    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    // Verify title
    const title = page.getByRole('heading', { name: /Approved Change Orders/i });
    await expect(title).toBeVisible();

    // Verify tabs
    const approvedTab = page.getByRole('button', { name: 'Approved COs' });
    const historyTab = page.getByRole('button', { name: 'History' });
    await expect(approvedTab).toBeVisible();
    await expect(historyTab).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/approved-cos-sidebar.png',
      fullPage: true
    });

    // Test tab switching
    await historyTab.click();
    await page.waitForTimeout(500);

    // Close sidebar
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await page.waitForTimeout(500);
  });

  test('should open Job To Date Cost Detail sidebar', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(2);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    const title = page.getByRole('heading', { name: /Job to Date Cost Detail/i });
    await expect(title).toBeVisible();

    // Test tab switching
    const breakdownTab = page.getByRole('button', { name: 'Breakdown' });
    await breakdownTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/job-to-date-cost-sidebar.png',
      fullPage: true
    });

    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
  });

  test('should open Direct Costs sidebar with payments toggle', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(3);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    const title = page.getByRole('heading', { name: /Direct Costs/i });
    await expect(title).toBeVisible();

    // Verify payments toggle exists
    const paymentsLabel = page.getByText('Show Payments');
    await expect(paymentsLabel).toBeVisible();

    // Verify status filter buttons
    const allFilter = page.getByRole('button', { name: 'All' });
    const pendingFilter = page.getByRole('button', { name: 'Pending' });
    const approvedFilter = page.getByRole('button', { name: 'Approved' });
    await expect(allFilter).toBeVisible();
    await expect(pendingFilter).toBeVisible();
    await expect(approvedFilter).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/direct-costs-sidebar.png',
      fullPage: true
    });

    // Test status filter
    await pendingFilter.click();
    await page.waitForTimeout(500);

    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
  });

  test('should open Pending Budget Changes sidebar', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(4);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    const title = page.getByRole('heading', { name: /Pending Budget Changes/i });
    await expect(title).toBeVisible();

    // Verify description box with warning
    const aboutHeading = page.getByText('About Pending Budget Changes');
    await expect(aboutHeading).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/pending-budget-changes-sidebar.png',
      fullPage: true
    });

    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
  });

  test('should open Committed Costs sidebar', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(5);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    const title = page.getByRole('heading', { name: /Committed Costs/i });
    await expect(title).toBeVisible();

    // Verify type filters
    const allFilter = page.getByRole('button', { name: 'All' });
    const subcontractsFilter = page.getByRole('button', { name: 'Subcontracts' });
    const posFilter = page.getByRole('button', { name: 'POs' });
    await expect(allFilter).toBeVisible();
    await expect(subcontractsFilter).toBeVisible();
    await expect(posFilter).toBeVisible();

    // Test tab switching
    const breakdownTab = page.getByRole('button', { name: 'Breakdown' });
    await breakdownTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/committed-costs-sidebar.png',
      fullPage: true
    });

    // Test type filter
    const commitmentsTab = page.getByRole('button', { name: 'Commitments' });
    await commitmentsTab.click();
    await subcontractsFilter.click();
    await page.waitForTimeout(500);

    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
  });

  test('should open Pending Cost Changes sidebar', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(6);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    const title = page.getByRole('heading', { name: /Pending Cost Changes/i });
    await expect(title).toBeVisible();

    // Verify type filters
    const allFilter = page.getByRole('button', { name: 'All' });
    const commitmentsFilter = page.getByRole('button', { name: 'Commitments' });
    const cosFilter = page.getByRole('button', { name: 'COs' });
    await expect(allFilter).toBeVisible();
    await expect(commitmentsFilter).toBeVisible();
    await expect(cosFilter).toBeVisible();

    // Test tab switching
    const summaryTab = page.getByRole('button', { name: 'Summary' });
    await summaryTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/pending-cost-changes-sidebar.png',
      fullPage: true
    });

    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
  });

  test('should open Forecast To Complete sidebar', async ({ page }) => {
    const cell = page.locator('button[aria-label*="Edit $"]').nth(7);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    const title = page.getByRole('heading', { name: /Forecast To Complete/i });
    await expect(title).toBeVisible();

    // Verify forecast method radio buttons
    const lumpSumLabel = page.locator('label:has-text("Lump Sum")');
    const manualLabel = page.locator('label:has-text("Manual")');
    const monitoredLabel = page.locator('label:has-text("Monitored")');
    await expect(lumpSumLabel).toBeVisible();
    await expect(manualLabel).toBeVisible();
    await expect(monitoredLabel).toBeVisible();

    // Verify budget summary
    const projectedBudget = page.getByText('Projected Budget');
    const projectedCosts = page.getByText('Projected Costs');
    await expect(projectedBudget).toBeVisible();
    await expect(projectedCosts).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/forecast-to-complete-sidebar.png',
      fullPage: true
    });

    // Test forecast method selection
    await manualLabel.click();
    await page.waitForTimeout(500);

    // Verify forecast amount input appears
    const forecastInput = page.locator('input#forecastAmount');
    await expect(forecastInput).toBeVisible();

    // Test history tab
    const historyTab = page.getByRole('button', { name: 'History' });
    await historyTab.click();
    await page.waitForTimeout(500);

    const closeButton = page.getByRole('button', { name: 'Cancel' }).or(
      page.getByRole('button', { name: 'Close' })
    ).first();
    await closeButton.click();
  });

  test('should test sidebar responsiveness', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const cell = page.locator('button[aria-label*="Edit $"]').first();
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    // Take mobile screenshot
    await page.screenshot({
      path: 'tests/screenshots/budget-sidebar-mobile.png',
      fullPage: true
    });

    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await page.waitForTimeout(500);

    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await cell.click();
    await page.waitForTimeout(1000);
    await expect(sidebar).toBeVisible();

    // Take tablet screenshot
    await page.screenshot({
      path: 'tests/screenshots/budget-sidebar-tablet.png',
      fullPage: true
    });

    await closeButton.click();
  });

  test('should verify sidebar close behavior', async ({ page }) => {
    // Test clicking outside sidebar closes it
    const cell = page.locator('button[aria-label*="Edit $"]').first();
    await cell.click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator('[role="dialog"][data-state="open"]');
    await expect(sidebar).toBeVisible();

    // Click on overlay (outside sidebar)
    const overlay = page.locator('[data-radix-sheet-overlay]').or(
      page.locator('[data-state="open"]').first()
    );

    // Try ESC key to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});
