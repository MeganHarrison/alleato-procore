import { expect, test } from '@playwright/test';

test.describe('Modal Rendering Test', () => {
  test.use({ storageState: undefined });

  test('should manually trigger modal and check rendering', async ({ page }) => {
    await page.goto('/67/budget');
    await page.waitForLoadState('networkidle');

    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });

    // Manually trigger the modal by executing JavaScript
    // This simulates what happens when handleEditLineItem is called
    await page.evaluate(() => {
      // Find React root and trigger modal
      const mockLineItem = {
        id: 'test-123',
        costCode: '01-100',
        description: 'Test Line Item',
        originalBudgetAmount: 10000,
        budgetModifications: 0,
        approvedCOs: 0,
        revisedBudget: 10000,
        jobToDateCostDetail: 0,
        directCosts: 0,
        pendingChanges: 0,
        projectedBudget: 10000,
        committedCosts: 0,
        pendingCostChanges: 0,
        projectedCosts: 0,
        forecastToComplete: 0,
        estimatedCostAtCompletion: 0,
        projectedOverUnder: 0,
      };

      // Trigger a custom event that the page can listen for
      window.dispatchEvent(new CustomEvent('test:openModal', { detail: mockLineItem }));
    });

    await page.waitForTimeout(500);

    // Check for dialog overlay
    const overlay = page.locator('[data-radix-dialog-overlay]');
    const overlayVisible = await overlay.isVisible();
    console.log('Overlay visible:', overlayVisible);

    if (overlayVisible) {
      await page.screenshot({ path: 'tests/screenshots/modal-overlay-visible.png', fullPage: true });

      // Check for modal content
      const modalContent = page.locator('[role="dialog"]');
      const modalVisible = await modalContent.isVisible();
      console.log('Modal content visible:', modalVisible);

      if (modalVisible) {
        // Get modal dimensions
        const boundingBox = await modalContent.boundingBox();
        console.log('Modal bounding box:', boundingBox);

        // Get computed styles
        const styles = await modalContent.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            zIndex: computed.zIndex,
            position: computed.position,
          };
        });
        console.log('Modal styles:', styles);
      }

      // Check for specific modal elements
      const modalTitle = page.getByRole('heading');
      const titleCount = await modalTitle.count();
      console.log('Number of headings:', titleCount);

      if (titleCount > 0) {
        const titles = await page.locator('h2, h3, [role="heading"]').allInnerTexts();
        console.log('Modal titles:', titles);
      }
    }

    // Alternative: Try to manually set the modal state
    console.log('\\n--- Trying to find and examine BaseModal/Dialog structure ---');
    const dialogs = await page.locator('[role="dialog"]').all();
    console.log('Total dialogs found:', dialogs.length);

    for (let i = 0; i < dialogs.length; i++) {
      const dialog = dialogs[i];
      const innerHTML = await dialog.innerHTML().catch(() => 'ERROR');
      console.log(`Dialog ${i} HTML length:`, innerHTML.length);
      console.log(`Dialog ${i} visible:`, await dialog.isVisible());
    }
  });
});
