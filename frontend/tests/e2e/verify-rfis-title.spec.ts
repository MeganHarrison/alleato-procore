import { test, expect } from '@playwright/test';

test('verify RFIs page title and header', async ({ page }) => {
  await page.goto('http://localhost:3002/rfis');
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: 'tests/screenshots/rfis-page-title-check.png', fullPage: true });

  // Check for any heading elements
  const h1 = page.locator('h1');
  const h1Count = await h1.count();
  console.log('H1 count:', h1Count);
  if (h1Count > 0) {
    const h1Text = await h1.first().textContent();
    console.log('H1 text:', h1Text);
  }

  // Check for Heading component
  const headingComponent = page.locator('[class*="heading"]');
  const headingCount = await headingComponent.count();
  console.log('Heading component count:', headingCount);
  if (headingCount > 0) {
    const headingText = await headingComponent.first().textContent();
    console.log('Heading component text:', headingText);
  }

  // Check page header area
  const pageHeader = page.locator('header, [role="banner"], nav').first();
  const headerExists = await pageHeader.count() > 0;
  console.log('Page header exists:', headerExists);
  if (headerExists) {
    const headerText = await pageHeader.textContent();
    console.log('Header text:', headerText);
  }

  // Get page title from document
  const pageTitle = await page.title();
  console.log('Document title:', pageTitle);

  // Check for GenericDataTable title
  const tableTitle = page.locator('text=/RFIs?/i').first();
  const tableTitleExists = await tableTitle.count() > 0;
  console.log('Table title exists:', tableTitleExists);
  if (tableTitleExists) {
    const titleText = await tableTitle.textContent();
    console.log('Table title text:', titleText);
  }
});
