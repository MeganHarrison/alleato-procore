import { test, expect } from '@playwright/test';

test.describe('Budget Code Autopopulation and UOM Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dev login first to authenticate
    await page.goto('http://localhost:3000/dev-login?email=test@example.com&password=testpassword123');
    // Wait for initial redirect
    await page.waitForLoadState('networkidle');
  });

  test('should autopopulate newly created budget code in line item form', async ({ page }) => {
    // Navigate to budget page for project 67
    await page.goto('http://localhost:3000/67/budget');
    await page.waitForLoadState('networkidle');

    // Click the "Create Line Items" button to open the modal
    const createButton = page.locator('button:has-text("Create Line Items")');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for modal to open
    await expect(page.locator('text=Create Budget Line Items')).toBeVisible({ timeout: 5000 });

    // Verify first row has empty budget code
    const budgetCodeSelector = page.locator('button[role="combobox"]:has-text("Select budget code...")').first();
    await expect(budgetCodeSelector).toBeVisible();

    // Click on the budget code selector for the first row
    await budgetCodeSelector.click();
    await page.waitForTimeout(500);

    // Click "Create New Budget Code" option
    const createCodeOption = page.locator('text=Create New Budget Code');
    await expect(createCodeOption).toBeVisible({ timeout: 5000 });
    await createCodeOption.click();

    // Wait for "Create Budget Code" dialog to open
    await expect(page.locator('text=Create New Budget Code').nth(1)).toBeVisible({ timeout: 5000 });

    // Expand first division to see cost codes
    const firstDivision = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await firstDivision.click();
    await page.waitForTimeout(500);

    // Select first cost code under the expanded division
    const firstCostCode = page.locator('button').filter({ hasText: /-/ }).first();
    await firstCostCode.click();

    // Select cost type "M - Material"
    const costTypeSelector = page.locator('button[role="combobox"]').filter({ hasText: /^R - Contract Revenue/ });
    await costTypeSelector.click();
    await page.waitForTimeout(300);

    const materialOption = page.locator('text=M - Material');
    await materialOption.click();

    // Click "Create Budget Code" button
    const createBudgetCodeButton = page.locator('button:has-text("Create Budget Code")');
    await createBudgetCodeButton.click();

    // Wait for success toast with updated message
    await expect(page.locator('text=Budget code created and added to form')).toBeVisible({ timeout: 5000 });

    // Wait for dialog to close
    await page.waitForTimeout(1000);

    // Take screenshot after budget code creation
    await page.screenshot({ path: 'frontend/tests/screenshots/budget-code-autopopulated.png', fullPage: true });

    // VERIFY: The newly created budget code should be autopopulated in the first row
    const budgetCodeSelectorAfter = page.locator('button[role="combobox"]').first();
    const selectedText = await budgetCodeSelectorAfter.textContent();

    // Should no longer say "Select budget code..."
    expect(selectedText).not.toContain('Select budget code...');
    expect(selectedText).toContain('.M'); // Should contain Material cost type

    console.warn('✅ VERIFIED: Budget code was automatically populated in the first row');
  });

  test('should display enhanced UOM dropdown with descriptions', async ({ page }) => {
    // Navigate to budget page for project 67
    await page.goto('http://localhost:3000/67/budget');
    await page.waitForLoadState('networkidle');

    // Click the "Create Line Items" button to open the modal
    const createButton = page.locator('button:has-text("Create Line Items")');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for modal to open
    await expect(page.locator('text=Create Budget Line Items')).toBeVisible({ timeout: 5000 });

    // Click on UOM selector
    const uomSelector = page.locator('button[role="combobox"]').filter({ hasText: 'Select UOM' }).first();
    await expect(uomSelector).toBeVisible({ timeout: 5000 });
    await uomSelector.click();
    await page.waitForTimeout(500);

    // Take screenshot of UOM dropdown
    await page.screenshot({ path: 'frontend/tests/screenshots/uom-dropdown-enhanced.png', fullPage: true });

    // VERIFY: Enhanced UOM options with descriptions are present
    await expect(page.locator('text=EA - Each')).toBeVisible();
    await expect(page.locator('text=HR - Hour')).toBeVisible();
    await expect(page.locator('text=SF - Square Foot')).toBeVisible();
    await expect(page.locator('text=CY - Cubic Yard')).toBeVisible();
    await expect(page.locator('text=LS - Lump Sum')).toBeVisible();

    // VERIFY: New UOM options are present
    await expect(page.locator('text=WK - Week')).toBeVisible();
    await expect(page.locator('text=MO - Month')).toBeVisible();
    await expect(page.locator('text=SY - Square Yard')).toBeVisible();
    await expect(page.locator('text=CF - Cubic Foot')).toBeVisible();
    await expect(page.locator('text=LB - Pound')).toBeVisible();
    await expect(page.locator('text=GAL - Gallon')).toBeVisible();
    await expect(page.locator('text=KG - Kilogram')).toBeVisible();
    await expect(page.locator('text=M - Meter')).toBeVisible();
    await expect(page.locator('text=M² - Square Meter')).toBeVisible();
    await expect(page.locator('text=M³ - Cubic Meter')).toBeVisible();

    console.warn('✅ VERIFIED: Enhanced UOM dropdown displays all measurement options with descriptions');

    // Select a UOM option
    await page.locator('text=SF - Square Foot').click();
    await page.waitForTimeout(300);

    // Verify selection
    const uomSelectorAfter = page.locator('button[role="combobox"]').filter({ hasText: 'SF - Square Foot' }).first();
    await expect(uomSelectorAfter).toBeVisible();

    console.warn('✅ VERIFIED: UOM can be selected successfully');
  });

  test('should autopopulate budget code when all rows are filled', async ({ page }) => {
    // Navigate to budget page for project 67
    await page.goto('http://localhost:3000/67/budget');
    await page.waitForLoadState('networkidle');

    // Click the "Create Line Items" button to open the modal
    const createButton = page.locator('button:has-text("Create Line Items")');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Wait for modal to open
    await expect(page.locator('text=Create Budget Line Items')).toBeVisible({ timeout: 5000 });

    // Fill the first row with an existing budget code (without creating a new one)
    const budgetCodeSelector = page.locator('button[role="combobox"]:has-text("Select budget code...")').first();
    await budgetCodeSelector.click();
    await page.waitForTimeout(500);

    // Select first available budget code from the list
    const firstExistingCode = page.locator('[role="option"]').first();
    await firstExistingCode.click();
    await page.waitForTimeout(500);

    // Now create a new budget code - it should create a new row with the code
    await budgetCodeSelector.click();
    await page.waitForTimeout(500);

    const createCodeOption = page.locator('text=Create New Budget Code');
    await createCodeOption.click();

    // Wait for dialog
    await expect(page.locator('text=Create New Budget Code').nth(1)).toBeVisible({ timeout: 5000 });

    // Expand and select cost code
    const firstDivision = page.locator('button').filter({ hasText: /^[A-Z]/ }).first();
    await firstDivision.click();
    await page.waitForTimeout(500);

    const firstCostCode = page.locator('button').filter({ hasText: /-/ }).first();
    await firstCostCode.click();

    // Create the budget code
    const createBudgetCodeButton = page.locator('button:has-text("Create Budget Code")');
    await createBudgetCodeButton.click();

    // Wait for success
    await expect(page.locator('text=Budget code created and added to form')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'frontend/tests/screenshots/budget-code-new-row-created.png', fullPage: true });

    // VERIFY: A second row should have been created with the new budget code
    const allBudgetCodeSelectors = page.locator('button[role="combobox"]').filter({ hasText: /.+\./ });
    const count = await allBudgetCodeSelectors.count();
    expect(count).toBeGreaterThanOrEqual(2);

    console.warn('✅ VERIFIED: New row was created when existing row was filled');
  });
});
