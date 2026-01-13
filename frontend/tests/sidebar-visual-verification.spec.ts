import { test, expect } from '@playwright/test';

test.describe('Sidebar Visual Verification', () => {
  test('verify sidebar expanded and collapsed states', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Hard refresh to clear any cached state
    await page.reload({ waitUntil: 'networkidle' });

    // Check if we need to login
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Login required, authenticating...');
      await emailInput.fill('test1@mail.com');
      await page.locator('input[type="password"]').fill('test12026!!!');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
    }

    // Wait for sidebar to be visible
    await page.waitForSelector('[data-sidebar]', { state: 'visible', timeout: 10000 });

    // Wait a bit for animations to complete
    await page.waitForTimeout(1000);

    // STEP 3: Take full page screenshot of EXPANDED sidebar
    await page.screenshot({
      path: 'sidebar-expanded-fixed.png',
      fullPage: true
    });

    // Analyze expanded state
    console.log('\n=== EXPANDED SIDEBAR STATE ===');

    // Check sidebar width
    const sidebar = page.locator('[data-sidebar]');
    const sidebarBox = await sidebar.boundingBox();
    console.log(`Sidebar width: ${sidebarBox?.width}px (expected ~256px)`);

    // Check for section headings
    const sectionHeadings = [
      'Core Tools',
      'Project Management',
      'Financial Management',
      'Admin'
    ];

    for (const heading of sectionHeadings) {
      const headingElement = page.locator(`text="${heading}"`);
      const isVisible = await headingElement.isVisible().catch(() => false);
      console.log(`Section heading "${heading}": ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
    }

    // Check for text labels next to icons (look for navigation items)
    const navItems = page.locator('[data-sidebar-menu-item]');
    const navCount = await navItems.count();
    console.log(`Navigation items found: ${navCount}`);

    if (navCount > 0) {
      const firstNavItem = navItems.first();
      const firstNavText = await firstNavItem.textContent();
      console.log(`First nav item text: "${firstNavText?.trim()}"`);
    }

    // STEP 5: Click the sidebar toggle to COLLAPSE it
    console.log('\n=== Clicking sidebar toggle to COLLAPSE ===');
    const toggleButton = page.locator('[data-sidebar-trigger]');
    await toggleButton.click();

    // STEP 6: Wait 1 second for animation
    await page.waitForTimeout(1000);

    // STEP 7: Take full page screenshot of COLLAPSED sidebar
    await page.screenshot({
      path: 'sidebar-collapsed-fixed.png',
      fullPage: true
    });

    // STEP 8: Analyze collapsed state
    console.log('\n=== COLLAPSED SIDEBAR STATE ===');

    // Check sidebar width
    const collapsedBox = await sidebar.boundingBox();
    console.log(`Sidebar width: ${collapsedBox?.width}px (expected ~64px)`);

    // Check section headings are HIDDEN
    for (const heading of sectionHeadings) {
      const headingElement = page.locator(`text="${heading}"`);
      const isVisible = await headingElement.isVisible().catch(() => false);
      console.log(`Section heading "${heading}": ${isVisible ? 'VISIBLE (❌ SHOULD BE HIDDEN)' : 'HIDDEN (✓)'}`);
    }

    // Check that only icons are visible (navigation items should still exist but text hidden)
    const collapsedNavItems = page.locator('[data-sidebar-menu-item]');
    const collapsedNavCount = await collapsedNavItems.count();
    console.log(`Navigation items still present: ${collapsedNavCount}`);

    // Try to find icon elements
    const icons = page.locator('svg').filter({ has: page.locator('[data-sidebar-menu-item]') });
    const iconCount = await icons.count();
    console.log(`Icons visible: ${iconCount}`);

    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('Screenshots saved:');
    console.log('  - sidebar-expanded-fixed.png');
    console.log('  - sidebar-collapsed-fixed.png');
  });
});
