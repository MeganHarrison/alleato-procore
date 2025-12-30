/**
 * PROCORE DOCS CHAT E2E TESTS
 *
 * Tests the RAG-powered documentation chat feature
 */

import { test, expect } from '@playwright/test';

test.describe('Procore Docs Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page where chat should be available
    await page.goto('/');
  });

  test('should show floating chat button', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for the chat button (it should be a button with MessageCircle icon)
    const chatButton = page.locator('button[title="Ask Procore Docs"]');

    await expect(chatButton).toBeVisible();
  });

  test('should open chat dialog when button clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click the chat button
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Check that dialog opened
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Check for dialog title
    const title = page.getByRole('heading', { name: 'Ask Procore Docs' });
    await expect(title).toBeVisible();
  });

  test('should show empty state message initially', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Check for empty state message
    const emptyMessage = page.getByText(/Ask me anything about Procore/i);
    await expect(emptyMessage).toBeVisible();
  });

  test('should have input field and send button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Check for input field
    const input = page.getByPlaceholder('Ask a question...');
    await expect(input).toBeVisible();

    // Check for send button
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
  });

  test('should send a question and receive an answer', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Type a question
    const input = page.getByPlaceholder('Ask a question...');
    await input.fill('What is a budget?');

    // Click send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for the user message to appear
    await expect(page.getByText('What is a budget?')).toBeVisible();

    // Wait for loading indicator
    await expect(page.locator('svg.animate-spin')).toBeVisible();

    // Wait for response (with longer timeout since API call is involved)
    await expect(page.locator('svg.animate-spin')).not.toBeVisible({ timeout: 15000 });

    // Check that there are now 2 messages (user + assistant)
    const messages = page.locator('[class*="rounded-lg"][class*="px-4"][class*="py-2"]');
    await expect(messages).toHaveCount(2);
  });

  test('should show sources with links', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Send a question
    const input = page.getByPlaceholder('Ask a question...');
    await input.fill('How do I create a budget?');

    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(5000); // Give it time to get response

    // Look for "Sources:" text
    const sourcesLabel = page.getByText('Sources:');

    // If sources are present, verify they have links
    if (await sourcesLabel.isVisible()) {
      const sourceLinks = page.locator('a[target="_blank"]');
      await expect(sourceLinks.first()).toBeVisible();
    }
  });

  test('should handle multiple questions in sequence', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    const input = page.getByPlaceholder('Ask a question...');
    const sendButton = page.locator('button[type="submit"]');

    // First question
    await input.fill('What is a budget?');
    await sendButton.click();
    await page.waitForTimeout(5000);

    // Second question
    await input.fill('What is a change order?');
    await sendButton.click();
    await page.waitForTimeout(5000);

    // Should have 4 messages (2 questions + 2 answers)
    const messages = page.locator('[class*="rounded-lg"][class*="px-4"][class*="py-2"]');
    await expect(messages).toHaveCount(4, { timeout: 20000 });
  });

  test('should close dialog when clicking close button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Wait for dialog to be visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Close the dialog (look for X button or click outside)
    await page.keyboard.press('Escape');

    // Dialog should be hidden
    await expect(dialog).not.toBeVisible();
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open chat
    const chatButton = page.locator('button[title="Ask Procore Docs"]');
    await chatButton.click();

    // Send button should be disabled initially
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeDisabled();

    // Type something
    const input = page.getByPlaceholder('Ask a question...');
    await input.fill('test');

    // Now it should be enabled
    await expect(sendButton).toBeEnabled();

    // Clear input
    await input.clear();

    // Should be disabled again
    await expect(sendButton).toBeDisabled();
  });
});
