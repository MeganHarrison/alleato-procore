import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Change Events - Debug Navigation', () => {
  const screenshotsDir = path.join(__dirname, '../screenshots/change-events');
  const projectId = 60; // Known project ID from API

  test('Debug: Navigate directly to create form', async ({ page }) => {
    console.warn('Navigating directly to create form...');

    // Navigate directly to the create form
    await page.goto(`/${projectId}/change-events/new`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.warn('Console error:', msg.text());
      }
    });

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'debug-create-form-direct.png'),
      fullPage: true
    });

    // Check URL
    console.warn('Current URL:', page.url());

    // Look for page title
    const pageTitle = await page.locator('h1, h2').allTextContents();
    console.warn('Page titles found:', pageTitle);

    // Look for form elements
    const formElements = {
      form: await page.locator('form').count(),
      inputs: await page.locator('input').count(),
      textareas: await page.locator('textarea').count(),
      selects: await page.locator('select').count(),
      buttons: await page.locator('button').count(),
    };
    console.warn('Form elements found:', formElements);

    // Look for specific form fields by label or placeholder
    const numberField = page.locator('input[name="number"], label:has-text("Number") + input, label:has-text("number") + input').first();
    const titleField = page.locator('input[name="title"], label:has-text("Title") + input, label:has-text("title") + input').first();

    console.warn('Number field exists:', await numberField.count() > 0);
    console.warn('Title field exists:', await titleField.count() > 0);

    // Get all input names
    const inputNames = await page.locator('input[name]').evaluateAll(inputs =>
      inputs.map((input: any) => input.name)
    );
    console.warn('Input field names found:', inputNames);

    // Get all button texts
    const buttonTexts = await page.locator('button').allTextContents();
    console.warn('Button texts:', buttonTexts);

    // Check for errors
    const errorText = await page.locator('text=/error|failed|cannot/i').allTextContents();
    if (errorText.length > 0) {
      console.warn('Error messages on page:', errorText);
    }

    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.warn('\nConsole Errors:');
      consoleErrors.forEach(err => console.warn(`  - ${err}`));
    }
  });

  test('Debug: Click button from list page', async ({ page }) => {
    console.warn('Testing button click navigation...');

    // Navigate to list page
    await page.goto(`/${projectId}/change-events`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    console.warn('On list page, URL:', page.url());

    // Take screenshot of list page
    await page.screenshot({
      path: path.join(screenshotsDir, 'debug-list-before-click.png'),
      fullPage: true
    });

    // Find all buttons
    const allButtons = await page.locator('button, a[role="button"]').allTextContents();
    console.warn('All buttons/links on page:', allButtons);

    // Look for create button with various selectors
    const createButtonSelectors = [
      'button:has-text("New Change Event")',
      'button:has-text("Create")',
      'a:has-text("New Change Event")',
      'a:has-text("Create")',
      '[data-testid="create-change-event"]',
    ];

    let createButton = null;
    for (const selector of createButtonSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        createButton = btn;
        console.warn(`Found create button with selector: ${selector}`);
        break;
      }
    }

    if (createButton) {
      console.warn('Clicking create button...');
      await createButton.click();
      await page.waitForTimeout(2000);

      console.warn('After click, URL:', page.url());

      // Take screenshot after click
      await page.screenshot({
        path: path.join(screenshotsDir, 'debug-after-button-click.png'),
        fullPage: true
      });

      // Check if URL changed
      if (page.url().includes('/new')) {
        console.warn('✓ Successfully navigated to /new page');
      } else {
        console.warn('✗ Did NOT navigate to /new page');
      }
    } else {
      console.warn('✗ Could not find create button');
    }
  });

  test('Debug: Check API endpoint', async ({ request }) => {
    console.warn('Testing change events API...');

    // Test GET endpoint
    const getResponse = await request.get(`${process.env.BASE_URL || 'http://localhost:3000'}/api/projects/${projectId}/change-events`);
    console.warn('GET /api/projects/:id/change-events');
    console.warn('  Status:', getResponse.status());

    if (getResponse.ok()) {
      const data = await getResponse.json();
      console.warn('  Response:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      console.warn('  Error:', await getResponse.text());
    }

    // Test POST endpoint (with minimal data)
    const postResponse = await request.post(`${process.env.BASE_URL || 'http://localhost:3000'}/api/projects/${projectId}/change-events`, {
      data: {
        number: 'TEST-001',
        title: 'API Test Change Event',
        type: 'owner_change',
        scope: 'tbd',
        status: 'open',
      }
    });

    console.warn('\nPOST /api/projects/:id/change-events');
    console.warn('  Status:', postResponse.status());

    if (postResponse.ok()) {
      const data = await postResponse.json();
      console.warn('  Created:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      const errorText = await postResponse.text();
      console.warn('  Error:', errorText);
    }
  });
});
