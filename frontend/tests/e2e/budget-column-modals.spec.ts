import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for all budget column detail modals
 * Tests the 8 new modals created for budget table columns
 */

test.describe('Budget Column Detail Modals', () => {
  test.use({ storageState: undefined });

  test.beforeEach(async ({ page }) => {
    // Navigate to budget page
    await page.goto('/67/budget');
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
  });

  /**
   * Helper function to expand parent rows and find clickable cells
   */
  async function expandRowsAndFindCell(page: any, columnIndex: number) {
    // Expand first parent row to see child line items
    const expandButton = page.locator('button[aria-label*="Expand"]').first();
    const expandExists = await expandButton.count();

    if (expandExists > 0) {
      await expandButton.click();
      await page.waitForTimeout(500);
    }

    // Find all editable cells in the specified column
    const cells = page.locator('button[aria-label*="Edit $"]');
    const cellCount = await cells.count();

    if (cellCount > columnIndex) {
      return cells.nth(columnIndex);
    }

    return cells.first();
  }

  test('should open Budget Modifications modal', async ({ page }) => {
    // Find and click Budget Modifications cell
    const cell = await page.locator('button[aria-label*="Edit $"]').first();
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title contains "Budget Modifications for"
    const title = page.getByRole('heading', { name: /Budget Modifications for/i });
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
      path: 'tests/screenshots/budget-modifications-modal.png',
      fullPage: true
    });

    // Test tab switching
    await detailsTab.click();
    await page.waitForTimeout(500);

    // Verify details content is visible
    const tableHeader = page.getByText('Modification Number');
    await expect(tableHeader).toBeVisible();

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await page.waitForTimeout(500);
    await expect(modal).not.toBeVisible();
  });

  test('should open Approved COs modal', async ({ page }) => {
    // Navigate and click on Approved COs column
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(1);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Approved Change Orders for/i });
    await expect(title).toBeVisible();

    // Verify tabs
    const approvedTab = page.getByRole('button', { name: 'Approved COs' });
    const historyTab = page.getByRole('button', { name: 'History' });
    await expect(approvedTab).toBeVisible();
    await expect(historyTab).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/approved-cos-modal.png',
      fullPage: true
    });

    // Test tab switching
    await historyTab.click();
    await page.waitForTimeout(500);

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should open Job To Date Cost Detail modal', async ({ page }) => {
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(2);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Job To Date Cost for/i });
    await expect(title).toBeVisible();

    // Verify tabs
    const directCostsTab = page.getByRole('button', { name: 'Direct Costs' });
    const breakdownTab = page.getByRole('button', { name: 'Breakdown' });
    await expect(directCostsTab).toBeVisible();
    await expect(breakdownTab).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/job-to-date-cost-detail-modal.png',
      fullPage: true
    });

    // Test tab switching to breakdown
    await breakdownTab.click();
    await page.waitForTimeout(500);

    // Verify breakdown cards are visible
    const breakdownContent = page.locator('.grid.grid-cols-1');
    await expect(breakdownContent).toBeVisible();

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should open Direct Costs modal with payments toggle', async ({ page }) => {
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(3);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Direct Costs for/i });
    await expect(title).toBeVisible();

    // Verify payments toggle exists
    const paymentsToggle = page.getByText('Show Payments');
    await expect(paymentsToggle).toBeVisible();

    // Verify status filter buttons
    const allFilter = page.getByRole('button', { name: 'All' });
    const pendingFilter = page.getByRole('button', { name: 'Pending' });
    const approvedFilter = page.getByRole('button', { name: 'Approved' });
    await expect(allFilter).toBeVisible();
    await expect(pendingFilter).toBeVisible();
    await expect(approvedFilter).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/direct-costs-modal.png',
      fullPage: true
    });

    // Test payments toggle
    const toggleSwitch = page.locator('button[role="switch"]');
    await toggleSwitch.click();
    await page.waitForTimeout(500);

    // Take screenshot with payments visible
    await page.screenshot({
      path: 'tests/screenshots/direct-costs-modal-with-payments.png',
      fullPage: true
    });

    // Test status filter
    await pendingFilter.click();
    await page.waitForTimeout(500);

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should open Pending Budget Changes modal', async ({ page }) => {
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(4);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Pending Budget Changes for/i });
    await expect(title).toBeVisible();

    // Verify description box with warning
    const descriptionBox = page.locator('.bg-yellow-50.border-yellow-200');
    await expect(descriptionBox).toBeVisible();

    // Verify "About Pending Budget Changes" heading
    const aboutHeading = page.getByText('About Pending Budget Changes');
    await expect(aboutHeading).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/pending-budget-changes-modal.png',
      fullPage: true
    });

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should open Committed Costs modal', async ({ page }) => {
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(5);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Committed Costs for/i });
    await expect(title).toBeVisible();

    // Verify tabs
    const commitmentsTab = page.getByRole('button', { name: 'Commitments' });
    const breakdownTab = page.getByRole('button', { name: 'Breakdown' });
    await expect(commitmentsTab).toBeVisible();
    await expect(breakdownTab).toBeVisible();

    // Verify type filters
    const allFilter = page.getByRole('button', { name: 'All' });
    const subcontractsFilter = page.getByRole('button', { name: 'Subcontracts' });
    const posFilter = page.getByRole('button', { name: 'POs' });
    await expect(allFilter).toBeVisible();
    await expect(subcontractsFilter).toBeVisible();
    await expect(posFilter).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/committed-costs-modal.png',
      fullPage: true
    });

    // Test tab switching
    await breakdownTab.click();
    await page.waitForTimeout(500);

    // Verify breakdown cards
    const breakdownContent = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
    await expect(breakdownContent).toBeVisible();

    // Take screenshot of breakdown
    await page.screenshot({
      path: 'tests/screenshots/committed-costs-breakdown.png',
      fullPage: true
    });

    // Test type filter
    await commitmentsTab.click();
    await page.waitForTimeout(300);
    await subcontractsFilter.click();
    await page.waitForTimeout(500);

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should open Pending Cost Changes modal', async ({ page }) => {
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(6);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Pending Cost Changes for/i });
    await expect(title).toBeVisible();

    // Verify tabs
    const pendingTab = page.getByRole('button', { name: 'Pending Changes' });
    const summaryTab = page.getByRole('button', { name: 'Summary' });
    await expect(pendingTab).toBeVisible();
    await expect(summaryTab).toBeVisible();

    // Verify type filters
    const allFilter = page.getByRole('button', { name: 'All' });
    const commitmentsFilter = page.getByRole('button', { name: 'Commitments' });
    const cosFilter = page.getByRole('button', { name: 'COs' });
    await expect(allFilter).toBeVisible();
    await expect(commitmentsFilter).toBeVisible();
    await expect(cosFilter).toBeVisible();

    // Verify description box
    const descriptionBox = page.locator('.bg-orange-50.border-orange-200');
    await expect(descriptionBox).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/pending-cost-changes-modal.png',
      fullPage: true
    });

    // Test tab switching
    await summaryTab.click();
    await page.waitForTimeout(500);

    // Verify summary breakdown cards
    const summaryCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-2');
    await expect(summaryCards).toBeVisible();

    // Test type filter
    await pendingTab.click();
    await page.waitForTimeout(300);
    await commitmentsFilter.click();
    await page.waitForTimeout(500);

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should open Forecast To Complete modal', async ({ page }) => {
    const cell = await page.locator('button[aria-label*="Edit $"]').nth(7);
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    // Verify modal opens
    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Verify modal title
    const title = page.getByRole('heading', { name: /Forecast To Complete for/i });
    await expect(title).toBeVisible();

    // Verify tabs
    const forecastTab = page.getByRole('button', { name: 'Forecast' });
    const historyTab = page.getByRole('button', { name: 'History' });
    await expect(forecastTab).toBeVisible();
    await expect(historyTab).toBeVisible();

    // Verify forecast method radio buttons
    const lumpSumRadio = page.locator('label:has-text("Lump Sum")');
    const manualRadio = page.locator('label:has-text("Manual")');
    const monitoredRadio = page.locator('label:has-text("Monitored")');
    await expect(lumpSumRadio).toBeVisible();
    await expect(manualRadio).toBeVisible();
    await expect(monitoredRadio).toBeVisible();

    // Verify budget summary
    const projectedBudget = page.getByText('Projected Budget');
    const projectedCosts = page.getByText('Projected Costs');
    await expect(projectedBudget).toBeVisible();
    await expect(projectedCosts).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/forecast-to-complete-modal.png',
      fullPage: true
    });

    // Test forecast method selection
    await manualRadio.click();
    await page.waitForTimeout(500);

    // Verify forecast amount input appears
    const forecastInput = page.locator('input#forecastAmount');
    await expect(forecastInput).toBeVisible();

    // Take screenshot with manual method
    await page.screenshot({
      path: 'tests/screenshots/forecast-manual-method.png',
      fullPage: true
    });

    // Test monitored method (should hide input)
    await monitoredRadio.click();
    await page.waitForTimeout(500);
    await expect(forecastInput).not.toBeVisible();

    // Verify calculation display
    const forecastToComplete = page.getByText('Forecast To Complete');
    const estimatedCost = page.getByText('Estimated Cost at Completion');
    const projectedOverUnder = page.getByText('Projected Over / Under');
    await expect(forecastToComplete).toBeVisible();
    await expect(estimatedCost).toBeVisible();
    await expect(projectedOverUnder).toBeVisible();

    // Test history tab
    await historyTab.click();
    await page.waitForTimeout(500);

    // Verify history content
    const historyText = page.getByText('View the history of forecast changes');
    await expect(historyText).toBeVisible();

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' });
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });

  test('should test modal responsiveness', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const cell = await page.locator('button[aria-label*="Edit $"]').first();
    await expect(cell).toBeVisible({ timeout: 10000 });
    await cell.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Take mobile screenshot
    await page.screenshot({
      path: 'tests/screenshots/budget-modal-mobile.png',
      fullPage: true
    });

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' }).or(
      page.getByRole('button', { name: 'Cancel' })
    ).first();
    await closeButton.click();
    await page.waitForTimeout(500);

    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await cell.click();
    await page.waitForTimeout(1000);
    await expect(modal).toBeVisible();

    // Take tablet screenshot
    await page.screenshot({
      path: 'tests/screenshots/budget-modal-tablet.png',
      fullPage: true
    });

    // Close modal
    await closeButton.click();
  });

  test('should verify all modals have proper close behavior', async ({ page }) => {
    // Test clicking outside modal closes it
    const cell = await page.locator('button[aria-label*="Edit $"]').first();
    await cell.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[data-radix-dialog-content]');
    await expect(modal).toBeVisible();

    // Click on overlay (outside modal)
    const overlay = page.locator('[data-radix-dialog-overlay]');
    await overlay.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Test ESC key closes modal
    await cell.click();
    await page.waitForTimeout(1000);
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(modal).not.toBeVisible();
  });
});
