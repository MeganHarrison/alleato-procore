import { test } from '@playwright/test';

test('check Companies page for title', async ({ page }) => {
  console.log('🔍 Testing http://localhost:3000/companies');
  await page.goto('/companies');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ 
    path: '/Users/meganharrison/Documents/github/alleato-procore/tests/screenshots/companies-page.png', 
    fullPage: true 
  });

  // Get all visible headings
  const headings = await page.locator('h1, h2, h3, h4').allTextContents();
  console.log('📋 All headings on Companies page:', headings);

  // Check for "Companies" or "Company Directory" text
  const companiesText = await page.locator('text=/compan/i').count();
  console.log('🔤 "Company" text appears', companiesText, 'times');
});
