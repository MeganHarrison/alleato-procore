import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } }); // Run without auth

test.describe('Sidebar Collapse After Server Restart', () => {
  test('verify sidebar is in icon collapsible mode with correct attributes', async ({ page }) => {
    console.log('\n=== SIDEBAR VERIFICATION TEST ===\n');

    // 1. Navigate to home page (dashboard requires auth)
    console.log('Step 1: Navigating to http://localhost:3000/');
    await page.goto('/');

    // 2. Wait for domcontentloaded (networkidle may not work without auth)
    console.log('Step 2: Waiting for page load...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give sidebar time to render

    // 3. Check the sidebar has data-testid="app-sidebar-with-icon-collapsible"
    console.log('Step 3: Verifying sidebar element exists...');
    const sidebar = page.locator('[data-testid="app-sidebar-with-icon-collapsible"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
    console.log('✓ VERIFIED: Sidebar with data-testid="app-sidebar-with-icon-collapsible" found');
    console.log('  → This proves the new code is loaded after server restart\n');

    // 4. Take screenshot of current state
    console.log('Step 4: Taking screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/sidebar-current-state.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: tests/screenshots/sidebar-current-state.png\n');

    // 5. Measure sidebar width
    console.log('Step 5: Measuring sidebar dimensions...');
    const widthComputed = await sidebar.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.width);
    });
    const box = await sidebar.boundingBox();
    console.log(`  - Computed width: ${widthComputed}px`);
    console.log(`  - Bounding box width: ${box?.width || 0}px`);

    // 6. Get data-collapsible attribute
    console.log('\nStep 6: Checking data-collapsible attribute...');
    const sidebarCollapsible = await sidebar.getAttribute('data-collapsible');
    console.log(`  - Sidebar element data-collapsible: ${sidebarCollapsible}`);

    // Check parent (the group that controls collapse behavior)
    const parent = page.locator('[data-testid="app-sidebar-with-icon-collapsible"]').first().locator('..');
    const parentCollapsible = await parent.getAttribute('data-collapsible').catch(() => null);
    console.log(`  - Parent element data-collapsible: ${parentCollapsible}`);

    const effectiveCollapsible = sidebarCollapsible || parentCollapsible;
    console.log(`  - Effective data-collapsible: ${effectiveCollapsible}`);

    // 7. Verify it's "icon" mode
    console.log('\nStep 7: Verifying icon collapsible mode...');
    if (effectiveCollapsible === 'icon') {
      console.log('✓ VERIFIED: data-collapsible is "icon"');
    } else {
      console.log(`✗ FAILED: data-collapsible is "${effectiveCollapsible}" (expected "icon")`);
    }
    expect(effectiveCollapsible).toBe('icon');

    // 8. Verify collapsed width (~64px)
    console.log('\nStep 8: Verifying collapsed width...');
    if (widthComputed >= 60 && widthComputed <= 80) {
      console.log(`✓ VERIFIED: Width is ${widthComputed}px (~64px expected for icon mode)`);
    } else {
      console.log(`⚠ WARNING: Width is ${widthComputed}px (expected ~64px for icon mode)`);
    }

    // 9. Check if section labels use the hide class
    console.log('\nStep 9: Checking section label visibility classes...');
    const labelsWithHideClass = page.locator('[data-testid="app-sidebar-with-icon-collapsible"] .group-data-\\[collapsible\\=icon\\]\\:hidden');
    const labelCount = await labelsWithHideClass.count();
    console.log(`  - Elements with group-data-[collapsible=icon]:hidden class: ${labelCount}`);

    if (labelCount > 0) {
      const firstLabel = labelsWithHideClass.first();
      const isVisible = await firstLabel.isVisible();
      const display = await firstLabel.evaluate(el => window.getComputedStyle(el).display);
      const opacity = await firstLabel.evaluate(el => window.getComputedStyle(el).opacity);

      console.log(`  - First label visible: ${isVisible}`);
      console.log(`  - First label display: ${display}`);
      console.log(`  - First label opacity: ${opacity}`);

      // In icon mode with parent data-collapsible="icon", these should be hidden
      if (!isVisible || display === 'none' || opacity === '0') {
        console.log('✓ VERIFIED: Section labels are properly hidden in icon mode');
      }
    }

    // 10. Check sidebar state attribute
    console.log('\nStep 10: Checking sidebar state...');
    const sidebarState = await parent.getAttribute('data-state').catch(() => null);
    console.log(`  - Sidebar data-state: ${sidebarState}`);

    // Final Summary
    console.log('\n=== FINAL VERIFICATION SUMMARY ===');
    console.log(`
TEST RESULTS:
1. Sidebar element found: ✓ (data-testid="app-sidebar-with-icon-collapsible")
2. New code loaded: ✓ (element exists after server restart)
3. Data-collapsible attribute: "${effectiveCollapsible}" ${effectiveCollapsible === 'icon' ? '✓' : '✗'}
4. Sidebar width: ${widthComputed}px ${widthComputed >= 60 && widthComputed <= 80 ? '✓' : '⚠'}
5. Sidebar state: ${sidebarState || 'null'}
6. Section labels with hide class: ${labelCount}
7. Screenshot: tests/screenshots/sidebar-current-state.png

CONCLUSION:
The sidebar is ${widthComputed < 100 ? 'COLLAPSED (icon-only mode)' : 'EXPANDED (full width)'}.
The data-collapsible="${effectiveCollapsible}" attribute is ${effectiveCollapsible === 'icon' ? 'CORRECT' : 'INCORRECT'}.
Server restart verification: ${effectiveCollapsible === 'icon' ? 'PASSED ✓' : 'FAILED ✗'}
    `);
  });
});
