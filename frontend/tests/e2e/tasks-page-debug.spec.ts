import { test, expect } from '@playwright/test';

test('tasks page debug - check loading and errors', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Listen for console messages
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Navigate to tasks page
  await page.goto('http://localhost:3000/tasks');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Capture screenshot
  await page.screenshot({
    path: 'tests/screenshots/tasks-page-debug.png',
    fullPage: true
  });

  // Log findings
  console.log('=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== PAGE ERRORS ===');
  if (errors.length > 0) {
    errors.forEach(err => console.log(err));
  } else {
    console.log('No page errors detected');
  }

  console.log('\n=== PAGE TITLE ===');
  console.log(await page.title());

  console.log('\n=== SCREENSHOT SAVED ===');
  console.log('Location: tests/screenshots/tasks-page-debug.png');
});
