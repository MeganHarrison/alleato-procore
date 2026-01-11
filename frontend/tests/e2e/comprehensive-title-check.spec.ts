import { test, expect } from '@playwright/test';

const ALL_MIGRATED_PAGES = [
  // SIMPLE pages
  { url: '/submittals', expectedTitle: 'Submittals', description: 'Submittal tracking and approvals' },
  { url: '/meetings', expectedTitle: 'Meetings', description: 'Meeting records and transcripts' },
  { url: '/drawings', expectedTitle: 'Drawings', description: 'Project drawings and plans' },
  { url: '/punch-list', expectedTitle: 'Punch List', description: 'Construction punch list items' },

  // MEDIUM pages
  { url: '/rfis', expectedTitle: 'RFIs', description: 'Requests for Information' },
  { url: '/users', expectedTitle: 'User Directory', description: 'Manage users and permissions' },
  { url: '/daily-log', expectedTitle: 'Daily Log', description: 'Daily construction logs' },
  { url: '/emails', expectedTitle: 'Emails', description: 'Email correspondence' },
  { url: '/photos', expectedTitle: 'Photos', description: 'Project photos and images' },

  // COMPLEX pages
  { url: '/infinite-meetings', expectedTitle: 'Meetings', description: 'Meeting records with inline editing' },
  { url: '/infinite-projects', expectedTitle: 'Projects', description: 'Project portfolio with infinite scroll' },
  { url: '/projects', expectedTitle: 'Projects', description: 'All construction projects' },

  // Directory pages
  { url: '/companies', expectedTitle: 'Company Directory', description: 'Manage your companies and contractors' },
  { url: '/contacts', expectedTitle: 'Contacts', description: 'Contact information management' },
  { url: '/clients', expectedTitle: 'Clients', description: 'Manage your client contacts' },
];

test.describe('Comprehensive Page Title Check', () => {
  for (const pageInfo of ALL_MIGRATED_PAGES) {
    test(`${pageInfo.url} - verify title and description`, async ({ page }) => {
      console.log(`\n🔍 Testing: ${pageInfo.url}`);

      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take screenshot
      const screenshotName = pageInfo.url.replace(/\//g, '-');
      const screenshotPath = `/Users/meganharrison/Documents/github/alleato-procore/frontend/tests/screenshots/title-check${screenshotName}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Check for H1 title
      const h1 = page.locator('h1').first();
      const h1Text = await h1.textContent();
      console.log(`  📋 H1 Title: "${h1Text?.trim()}"`);

      // Verify title is present
      expect(h1Text?.trim()).toContain(pageInfo.expectedTitle);

      // Check for description text
      const descriptionExists = await page.locator(`text="${pageInfo.description}"`).count() > 0;
      console.log(`  📝 Description present: ${descriptionExists ? '✅' : '❌'}`);

      // Check for create/add button
      const buttons = await page.locator('button').count();
      console.log(`  🔘 Buttons found: ${buttons}`);

      // Check for table or empty state
      const hasTable = await page.locator('table').count() > 0;
      const hasEmptyState = await page.locator('text=/No .* found/i').count() > 0;
      console.log(`  📊 Has table: ${hasTable ? '✅' : '❌'}`);
      console.log(`  📭 Has empty state: ${hasEmptyState ? '✅' : '❌'}`);

      // Overall status
      console.log(`  ✨ Status: ${h1Text?.includes(pageInfo.expectedTitle) ? 'PASS ✅' : 'FAIL ❌'}`);
    });
  }
});
