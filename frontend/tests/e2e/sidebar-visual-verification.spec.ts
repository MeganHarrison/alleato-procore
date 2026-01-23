import { test, expect } from '@playwright/test';

test.describe('Sidebar Visual Verification', () => {
  test('verify sidebar expanded and collapsed states', async ({ page }) => {
    // Navigate directly to dev-login to authenticate
    console.log('Authenticating via dev-login...');
    await page.goto('/dev-login?email=test1@mail.com&password=test12026!!!');
    await page.waitForLoadState('networkidle');

    // Wait a moment for redirect
    await page.waitForTimeout(1000);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for sidebar wrapper - this is the element with data-collapsible
    const sidebarWrapper = page.locator('.group.peer').first();
    await sidebarWrapper.waitFor({ state: 'visible', timeout: 10000 });

    // Also get the inner sidebar element
    const sidebar = page.locator('[data-sidebar="sidebar"]').first();

    console.log('\n=== EXPANDED SIDEBAR STATE ===\n');

    // Check current state on the wrapper
    const expandedState = await sidebarWrapper.getAttribute('data-state');
    const expandedCollapsible = await sidebarWrapper.getAttribute('data-collapsible');
    console.log(`Sidebar wrapper state: ${expandedState}`);
    console.log(`Sidebar wrapper data-collapsible: ${expandedCollapsible}`);

    // Take screenshot of EXPANDED sidebar
    console.log('\nCapturing EXPANDED sidebar screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/sidebar-expanded-full.png',
      fullPage: true
    });

    // Take a focused screenshot of just the sidebar
    await sidebar.screenshot({
      path: 'tests/screenshots/sidebar-expanded.png'
    });

    // Check for section titles (SidebarGroupLabel elements)
    const sectionLabels = page.locator('[data-sidebar="group-label"]');
    const labelCount = await sectionLabels.count();
    console.log(`\nFound ${labelCount} section label elements`);

    for (let i = 0; i < labelCount; i++) {
      const label = sectionLabels.nth(i);
      const isVisible = await label.isVisible();
      const text = await label.textContent();
      console.log(`  - "${text}": ${isVisible ? 'VISIBLE ✓' : 'HIDDEN ✗'}`);
    }

    // Get sidebar dimensions
    const sidebarBox = await sidebar.boundingBox();
    if (sidebarBox) {
      console.log(`\nSidebar width (expanded): ${sidebarBox.width}px`);
    }

    // Now find and click the toggle button to collapse the sidebar
    console.log('\n=== COLLAPSING SIDEBAR ===\n');

    // Look for the SidebarTrigger button
    const toggleButton = page.locator('[data-sidebar="trigger"]').first();

    const toggleExists = await toggleButton.count() > 0;
    console.log(`Toggle button exists: ${toggleExists}`);

    if (toggleExists) {
      const toggleVisible = await toggleButton.isVisible();
      console.log(`Toggle button visible: ${toggleVisible}`);

      await toggleButton.click({ timeout: 5000 });
      console.log('Clicked sidebar toggle button');

      // Wait for the collapse animation to complete
      await page.waitForTimeout(500);

      // Verify state changed to collapsed on the wrapper
      const collapsedState = await sidebarWrapper.getAttribute('data-state');
      const collapsedCollapsible = await sidebarWrapper.getAttribute('data-collapsible');
      console.log(`Sidebar wrapper state after toggle: ${collapsedState}`);
      console.log(`Sidebar wrapper data-collapsible after toggle: ${collapsedCollapsible}`);
    } else {
      console.log('Toggle button not found!');
    }

    console.log('\n=== COLLAPSED SIDEBAR STATE ===\n');

    // Take screenshot of COLLAPSED sidebar
    console.log('Capturing COLLAPSED sidebar screenshot...');
    await page.screenshot({
      path: 'tests/screenshots/sidebar-collapsed-full.png',
      fullPage: true
    });

    await sidebar.screenshot({
      path: 'tests/screenshots/sidebar-collapsed.png'
    });

    // Check section titles visibility in collapsed state
    console.log('\nSection label visibility when COLLAPSED:');
    for (let i = 0; i < labelCount; i++) {
      const label = sectionLabels.nth(i);
      const isVisible = await label.isVisible();
      const text = await label.textContent();

      // Check computed styles
      const display = await label.evaluate((el) => {
        return window.getComputedStyle(el).display;
      });

      console.log(`  - "${text}": ${isVisible ? 'VISIBLE ✗ (SHOULD BE HIDDEN!)' : 'HIDDEN ✓'} [display: ${display}]`);
    }

    // Get collapsed sidebar dimensions
    const collapsedBox = await sidebar.boundingBox();
    if (collapsedBox) {
      console.log(`\nSidebar width (collapsed): ${collapsedBox.width}px (expected: ~64px)`);
    }

    // Check wrapper classes
    const wrapperClasses = await sidebarWrapper.getAttribute('class');
    console.log(`\nWrapper classes: ${wrapperClasses}`);

    // Check if the group data attribute is being set
    const hasGroupData = await page.evaluate(() => {
      const wrapper = document.querySelector('.group.peer');
      if (wrapper) {
        const collapsible = wrapper.getAttribute('data-collapsible');
        const state = wrapper.getAttribute('data-state');
        return { collapsible, state, html: wrapper.outerHTML.substring(0, 200) };
      }
      return null;
    });
    console.log('\nWrapper element info:', hasGroupData);

    console.log('\n=== Screenshots saved to tests/screenshots/ ===');
    console.log('- sidebar-expanded-full.png (full page, expanded)');
    console.log('- sidebar-expanded.png (sidebar only, expanded)');
    console.log('- sidebar-collapsed-full.png (full page, collapsed)');
    console.log('- sidebar-collapsed.png (sidebar only, collapsed)');

    // SUMMARY
    console.log('\n=== SUMMARY ===');
    if (collapsedBox && sidebarBox) {
      const widthChanged = Math.abs(collapsedBox.width - sidebarBox.width) > 10;
      console.log(`Width changed: ${widthChanged ? 'YES ✓' : 'NO ✗'}`);
      console.log(`  Expanded: ${sidebarBox.width}px`);
      console.log(`  Collapsed: ${collapsedBox.width}px`);
    }

    // Check if labels are properly hidden
    let allLabelsHidden = true;
    for (let i = 0; i < labelCount; i++) {
      const label = sectionLabels.nth(i);
      const isVisible = await label.isVisible();
      if (isVisible) {
        allLabelsHidden = false;
        const text = await label.textContent();
        console.log(`\n⚠️  WARNING: Section label "${text}" is still VISIBLE when sidebar should be collapsed!`);
      }
    }

    if (allLabelsHidden && labelCount > 0) {
      console.log('\n✓ All section labels are properly hidden');
    }
  });
});
