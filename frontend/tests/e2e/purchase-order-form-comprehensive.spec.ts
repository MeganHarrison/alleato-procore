import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_PROJECT_ID = 118;

test.describe('Purchase Order Form - Comprehensive Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the Purchase Order creation form
    await page.goto(`${BASE_URL}/${TEST_PROJECT_ID}/commitments/new?type=purchase_order`);
    await page.waitForLoadState('networkidle');
  });

  test('should display all form sections', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: 'Create Purchase Order' })).toBeVisible();

    // Verify all major sections are present
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Schedule of Values' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contract Dates' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Privacy & Access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invoice Contacts' })).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-all-sections.png',
      fullPage: true
    });
  });

  test('should have all General Information fields', async ({ page }) => {
    // Contract Number
    await expect(page.locator('#contractNumber')).toBeVisible();
    await expect(page.locator('#contractNumber')).toHaveValue('PO-001');

    // Contract Company
    await expect(page.getByLabel('Contract Company')).toBeVisible();

    // Title
    await expect(page.locator('#title')).toBeVisible();

    // Status
    await expect(page.getByLabel('Status*')).toBeVisible();

    // Executed checkbox
    await expect(page.locator('#executed')).toBeVisible();

    // Default Retainage
    await expect(page.locator('#defaultRetainagePercent')).toBeVisible();

    // Assigned To
    await expect(page.getByLabel('Assigned To')).toBeVisible();

    // Bill To & Ship To
    await expect(page.locator('#billTo')).toBeVisible();
    await expect(page.locator('#shipTo')).toBeVisible();

    // Payment Terms & Ship Via
    await expect(page.locator('#paymentTerms')).toBeVisible();
    await expect(page.locator('#shipVia')).toBeVisible();

    // Description
    await expect(page.locator('#description')).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-general-info.png',
      fullPage: true
    });
  });

  test('should display empty SOV state correctly', async ({ page }) => {
    // Check for empty state message
    await expect(page.getByText('You Have No Line Items Yet')).toBeVisible();

    // Check for Add Line button
    await expect(page.getByRole('button', { name: /add line/i })).toBeVisible();

    // Check for Import CSV button
    await expect(page.getByRole('button', { name: /import sov from csv/i })).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-sov-empty.png',
      fullPage: true
    });
  });

  test('should add SOV line items with unit/quantity fields', async ({ page }) => {
    // Click Add Line button
    await page.getByRole('button', { name: /add line/i }).first().click();

    // Wait for table to appear
    await expect(page.getByRole('table')).toBeVisible();

    // Verify SOV table headers for unit/quantity mode
    await expect(page.getByRole('columnheader', { name: '#' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Change Event' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Budget Code' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Description' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Qty' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'UOM' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Unit Cost' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Amount' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Billed to Date' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Amount Remaining' })).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-sov-table-headers.png',
      fullPage: true
    });

    // Fill in line item data
    const row = page.getByRole('row').nth(1); // First data row

    // Budget Code
    await row.locator('input').nth(1).fill('01-1000');

    // Description
    await row.locator('input').nth(2).fill('Concrete Foundation');

    // Quantity
    await row.locator('input[type="number"]').nth(0).fill('100');

    // Unit Cost
    await row.locator('input[type="number"]').nth(1).fill('50');

    // Wait for auto-calculation
    await page.waitForTimeout(500);

    // Verify amount auto-calculated (100 * 50 = 5000)
    await expect(row.getByText('$5000.00')).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-sov-line-filled.png',
      fullPage: true
    });
  });

  test('should verify UOM dropdown options', async ({ page }) => {
    // Add a line item
    await page.getByRole('button', { name: /add line/i }).first().click();
    await expect(page.getByRole('table')).toBeVisible();

    // Find and click the UOM dropdown in the first row
    const row = page.getByRole('row').nth(1);
    const uomDropdown = row.locator('button').first(); // Select trigger button
    await uomDropdown.click();

    // Wait for dropdown to open
    await page.waitForTimeout(500);

    // Verify all UOM options
    await expect(page.getByRole('option', { name: 'Each' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Linear Foot' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Square Foot' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Cubic Yard' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Ton' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Hour' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Lump Sum' })).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-uom-dropdown.png',
      fullPage: true
    });

    // Select a UOM
    await page.getByRole('option', { name: 'Square Foot' }).click();
    await expect(uomDropdown).toContainText('SF');
  });

  test('should add multiple SOV lines and verify totals', async ({ page }) => {
    // Add first line
    await page.getByRole('button', { name: /add line/i }).first().click();
    await page.waitForTimeout(300);

    let row = page.getByRole('row').nth(1);
    await row.locator('input[type="number"]').nth(0).fill('100');
    await row.locator('input[type="number"]').nth(1).fill('50');
    await page.waitForTimeout(300);

    // Add second line
    await page.getByRole('button', { name: /add line/i }).first().click();
    await page.waitForTimeout(300);

    row = page.getByRole('row').nth(2);
    await row.locator('input[type="number"]').nth(0).fill('200');
    await row.locator('input[type="number"]').nth(1).fill('25');
    await page.waitForTimeout(300);

    // Verify totals row
    const totalRow = page.getByRole('row').last();
    await expect(totalRow).toContainText('Total:');
    await expect(totalRow).toContainText('$10000.00'); // 100*50 + 200*25 = 10000

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-sov-multiple-lines.png',
      fullPage: true
    });
  });

  test('should have all Contract Dates fields', async ({ page }) => {
    await expect(page.locator('#dates\\.contractDate')).toBeVisible();
    await expect(page.locator('#dates\\.deliveryDate')).toBeVisible();
    await expect(page.locator('#dates\\.signedPoReceivedDate')).toBeVisible();
    await expect(page.locator('#dates\\.issuedOnDate')).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-contract-dates.png',
      fullPage: true
    });
  });

  test('should have Privacy & Access controls', async ({ page }) => {
    // Private checkbox
    await expect(page.locator('#privacy\\.isPrivate')).toBeVisible();

    // Non-admin users field
    await expect(page.getByLabel('Access for Non-Admin Users')).toBeVisible();

    // Allow SOV view checkbox
    await expect(page.locator('#privacy\\.allowNonAdminViewSovItems')).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-privacy.png',
      fullPage: true
    });
  });

  test('should have Invoice Contacts section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Invoice Contacts' })).toBeVisible();

    // Should show message when no company selected
    await expect(page.getByText('Please select a Contract Company first')).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-invoice-contacts.png',
      fullPage: true
    });
  });

  test('should have Cancel and Create buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: /create purchase order/i })).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-action-buttons.png',
      fullPage: true
    });
  });

  test('should remove SOV line item', async ({ page }) => {
    // Add two lines
    await page.getByRole('button', { name: /add line/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /add line/i }).first().click();
    await page.waitForTimeout(300);

    // Verify 2 lines exist
    let rows = await page.getByRole('row').count();
    expect(rows).toBeGreaterThanOrEqual(3); // Header + 2 data rows

    // Click remove button on first line
    await page.getByRole('row').nth(1).getByRole('button').last().click();
    await page.waitForTimeout(300);

    // Verify only 1 line remains
    rows = await page.getByRole('row').count();
    expect(rows).toBe(3); // Header + 1 data row + footer

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-sov-after-remove.png',
      fullPage: true
    });
  });

  test('should show accounting method banner', async ({ page }) => {
    await expect(page.getByText(/this purchase order's accounting method is unit\/quantity-based/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /change to amount-based/i })).toBeVisible();

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-accounting-method.png',
      fullPage: true
    });
  });

  test('should fill complete form and submit', async ({ page }) => {
    // Fill General Information
    await page.locator('#contractNumber').fill('PO-TEST-001');
    await page.locator('#title').fill('Test Purchase Order');
    await page.locator('#paymentTerms').fill('Net 30');
    await page.locator('#description').fill('Test PO for comprehensive verification');

    // Add SOV line
    await page.getByRole('button', { name: /add line/i }).first().click();
    await page.waitForTimeout(300);

    const row = page.getByRole('row').nth(1);
    await row.locator('input').nth(1).fill('01-1000');
    await row.locator('input').nth(2).fill('Test Line Item');
    await row.locator('input[type="number"]').nth(0).fill('10');
    await row.locator('input[type="number"]').nth(1).fill('100');
    await page.waitForTimeout(500);

    // Capture filled form
    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-complete-filled.png',
      fullPage: true
    });

    // Click Create button
    await page.getByRole('button', { name: /create purchase order/i }).click();

    // Should navigate back to commitments page
    await page.waitForURL(`**/${TEST_PROJECT_ID}/commitments`);
    await expect(page.url()).toContain(`/${TEST_PROJECT_ID}/commitments`);

    await page.screenshot({
      path: 'frontend/tests/screenshots/po-form-after-submit.png',
      fullPage: true
    });
  });

  test('should handle Cancel button', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Should navigate back to commitments page
    await page.waitForURL(`**/${TEST_PROJECT_ID}/commitments`);
    await expect(page.url()).toContain(`/${TEST_PROJECT_ID}/commitments`);
  });
});
