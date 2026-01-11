import { test, expect } from '@playwright/test';

const PAGES_TO_TEST = [
  { url: '/rfis', expectedTitle: 'RFIs' },
  { url: '/submittals', expectedTitle: 'Submittals' },
  { url: '/punch-list', expectedTitle: 'Punch List' },
  { url: '/photos', expectedTitle: 'Photos' },
  { url: '/users', expectedTitle: 'User Directory' },
  { url: '/clients', expectedTitle: 'Clients' },
  { url: '/companies', expectedTitle: 'Company Directory' },
  { url: '/projects', expectedTitle: 'Projects' },
];

test.describe('Verify Page Titles', () => {
  for (const page of PAGES_TO_TEST) {
    test(`${page.url} should have title "${page.expectedTitle}"`, async ({ page: browserPage }) => {
      await browserPage.goto(`http://localhost:3000${page.url}`);
      await browserPage.waitForLoadState('networkidle');
      await browserPage.waitForTimeout(1000);

      // Check for the expected title in h1
      const h1 = browserPage.locator('h1').first();
      const h1Text = await h1.textContent();
      
      console.log(`${page.url} - H1 text: "${h1Text}"`);
      
      expect(h1Text?.trim()).toContain(page.expectedTitle);
    });
  }
});
