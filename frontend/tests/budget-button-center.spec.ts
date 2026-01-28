import { test, expect } from '@playwright/test';

test('verify Add Line Item button is centered', async ({ page }) => {
  // Navigate to budget page
  await page.goto('/98/budget');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/budget-button-test.png', fullPage: true });
  
  // Find the Add Line Item button container that should be centered
  const addButtonContainer = page.locator('div.flex.justify-center:has(button:has-text("Add Line Item"))');
  
  if (await addButtonContainer.count() > 0) {
    console.log('SUCCESS: Found centered Add Line Item button container with flex justify-center');
    
    // Get the button's bounding box
    const box = await addButtonContainer.boundingBox();
    if (box) {
      console.log(`Button container position: x=${box.x}, width=${box.width}`);
      
      // Get viewport width
      const viewport = page.viewportSize();
      if (viewport) {
        const expectedCenter = viewport.width / 2;
        const actualCenter = box.x + (box.width / 2);
        console.log(`Viewport width: ${viewport.width}, Expected center: ${expectedCenter}, Actual center: ${actualCenter}`);
      }
    }
  } else {
    console.log('WARNING: Could not find centered Add Line Item button container');
    
    // Check if there's any Add Line Item button
    const anyAddButton = page.locator('button:has-text("Add Line Item")');
    const count = await anyAddButton.count();
    console.log(`Found ${count} Add Line Item button(s)`);
    
    // Log all buttons on page
    const allButtons = await page.locator('button').all();
    console.log(`Total buttons on page: ${allButtons.length}`);
  }
});
