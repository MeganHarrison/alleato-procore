import { test, expect } from '@playwright/test';

test('Check Create Project Form', async ({ page }) => {
  // Navigate directly without auth
  await page.goto('/form-project');
  
  // Take screenshot
  await page.screenshot({ path: 'tests/screenshots/create-project-check.png', fullPage: true });
  
  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if form exists
  const form = await page.locator('form').count();
  console.log('Forms found:', form);
  
  // Check for specific elements
  const projectNameInput = await page.locator('input[name="name"], label:has-text("Project Name")').count();
  console.log('Project Name fields found:', projectNameInput);
  
  // Get page content
  const content = await page.content();
  if (content.includes('404') || content.includes('not found')) {
    console.log('Page shows 404 or not found');
  }
  
  // Check for any error messages
  const errors = await page.locator('.error, .runtime-error, [role="alert"]').allTextContents();
  if (errors.length > 0) {
    console.log('Errors found:', errors);
  }
});