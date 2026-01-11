import { test, expect } from '@playwright/test';

const TEST_PROJECT_ID = 67;
const TEST_COMMITMENT_ID = 'test-commitment-123';

// Mock commitment data
const mockCommitment = {
  id: TEST_COMMITMENT_ID,
  project_id: TEST_PROJECT_ID,
  number: 'SUB-001',
  title: 'Test Subcontract',
  status: 'approved',
  type: 'subcontract',
  contract_company: {
    id: '1',
    name: 'Test Contractor Inc',
  },
  accounting_method: 'amount_based',
  description: 'Test subcontract for E2E testing',
  original_amount: 100000,
  approved_change_orders: 15000,
  revised_contract_amount: 115000,
  billed_to_date: 50000,
  retention_percentage: 10,
  balance_to_finish: 65000,
  private: false,
  vendor_invoice_number: 'VIN-001',
  start_date: '2024-01-01T00:00:00Z',
  substantial_completion_date: '2024-06-30T00:00:00Z',
  executed_date: '2024-01-01T00:00:00Z',
  signed_received_date: '2024-01-05T00:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-10T14:30:00Z',
};

// Mock change orders
const mockChangeOrders = [
  {
    id: 'co-1',
    number: 'CO-001',
    title: 'Additional electrical work',
    status: 'approved',
    amount: 15000,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'co-2',
    number: 'CO-002',
    title: 'Foundation repairs',
    status: 'pending',
    amount: 8500,
    created_at: '2024-01-20T14:30:00Z',
  },
];

// Mock invoices
const mockInvoices = [
  {
    id: 1,
    number: 'INV-001',
    date: '2024-01-20T00:00:00Z',
    amount: 25000,
    paid_amount: 20000,
    status: 'approved',
  },
  {
    id: 2,
    number: 'INV-002',
    date: '2024-02-15T00:00:00Z',
    amount: 18000,
    paid_amount: 18000,
    status: 'paid',
  },
];

// Mock attachments
const mockAttachments = [
  {
    id: 'att-1',
    file_name: 'contract.pdf',
    url: 'https://example.com/files/contract.pdf',
    uploaded_at: '2024-01-10T14:00:00Z',
    uploaded_by: 'John Doe',
    file_size: 1024000,
  },
  {
    id: 'att-2',
    file_name: 'specifications.docx',
    url: 'https://example.com/files/specifications.docx',
    uploaded_at: '2024-01-15T10:30:00Z',
    uploaded_by: 'Jane Smith',
    file_size: 512000,
  },
];

test.describe('Commitment Detail Page - New Tabs', () => {
  test.beforeEach(async ({ page }) => {
    // Mock commitment detail endpoint
    await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}`, (route) => {
      const url = route.request().url();
      // Only mock the exact commitment endpoint (not sub-endpoints)
      if (!url.includes('change-orders') && !url.includes('invoices') && !url.includes('attachments')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCommitment),
        });
      } else {
        route.continue();
      }
    });

    // Mock change orders endpoint
    await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}/change-orders`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockChangeOrders }),
      });
    });

    // Mock invoices endpoint
    await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}/invoices`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockInvoices }),
      });
    });

    // Mock attachments GET/POST endpoint
    await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}/attachments`, (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockAttachments }),
        });
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Navigate to commitment detail page
    await page.goto(`/${TEST_PROJECT_ID}/commitments/${TEST_COMMITMENT_ID}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display all tabs including new tabs', async ({ page }) => {
    // Check that all tabs are present
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Overview' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Financial' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Schedule' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Change Orders' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Invoices' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Attachments' })).toBeVisible();
  });

  test('should switch tabs correctly', async ({ page }) => {
    // Click Change Orders tab
    await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
    await page.waitForTimeout(500);

    // Verify tab is selected
    const selectedTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(selectedTab).toContainText('Change Orders');

    // Click Invoices tab
    await page.locator('[role="tab"]').filter({ hasText: 'Invoices' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Invoices');

    // Click Attachments tab
    await page.locator('[role="tab"]').filter({ hasText: 'Attachments' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Attachments');
  });

  test.describe('Change Orders Tab', () => {
    test('should render Change Orders tab with data', async ({ page }) => {
      // Click Change Orders tab
      await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check table headers
      await expect(page.getByRole('button', { name: /Number/i }).first()).toBeVisible();
      await expect(page.getByText('Title').first()).toBeVisible();
      await expect(page.getByText('Status').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Amount/i }).first()).toBeVisible();
    });

    test('should display change order data in table', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that change order data is displayed
      await expect(page.getByText('CO-001')).toBeVisible();
      await expect(page.getByText('Additional electrical work')).toBeVisible();
      await expect(page.getByText('$15,000.00')).toBeVisible();

      await expect(page.getByText('CO-002')).toBeVisible();
      await expect(page.getByText('Foundation repairs')).toBeVisible();
    });

    test('should make change order numbers clickable', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that CO numbers are links
      const coLink = page.locator('a').filter({ hasText: 'CO-001' });
      await expect(coLink).toBeVisible();
      await expect(coLink).toHaveAttribute('href', `/${TEST_PROJECT_ID}/change-orders/co-1`);
    });

    test('should show empty state when no change orders', async ({ page }) => {
      // Override mock to return empty array
      await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}/change-orders`, (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
      await page.waitForTimeout(1000);

      // Check for empty state message
      await expect(page.getByText('No change orders for this commitment')).toBeVisible();
    });
  });

  test.describe('Invoices Tab', () => {
    test('should render Invoices tab with data', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Invoices' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check table headers
      await expect(page.getByRole('button', { name: /Number/i }).first()).toBeVisible();
      await expect(page.getByText('Date').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Amount/i }).first()).toBeVisible();
      await expect(page.getByText('Paid Amount').first()).toBeVisible();
    });

    test('should display invoice data in table', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Invoices' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that invoice data is displayed
      await expect(page.getByText('INV-001')).toBeVisible();
      await expect(page.getByText('INV-002')).toBeVisible();
    });

    test('should display invoice totals card', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Invoices' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check for totals card
      await expect(page.getByText('Invoice Totals')).toBeVisible();
      await expect(page.getByText('Total Invoiced')).toBeVisible();
      await expect(page.getByText('Total Paid')).toBeVisible();
      await expect(page.getByText('Remaining Balance')).toBeVisible();
    });

    test('should show empty state when no invoices', async ({ page }) => {
      // Override mock to return empty array
      await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}/invoices`, (route) => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.locator('[role="tab"]').filter({ hasText: 'Invoices' }).click();
      await page.waitForTimeout(1000);

      // Check for empty state message
      await expect(page.getByText('No invoices for this commitment')).toBeVisible();
    });
  });

  test.describe('Attachments Tab', () => {
    test('should render Attachments tab with data', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Attachments' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that Upload File button is present
      await expect(page.getByRole('button', { name: /Upload File/i })).toBeVisible();
    });

    test('should display attachment files', async ({ page }) => {
      await page.locator('[role="tab"]').filter({ hasText: 'Attachments' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that file names are displayed
      await expect(page.getByText('contract.pdf')).toBeVisible();
      await expect(page.getByText('specifications.docx')).toBeVisible();
    });

    test('should show empty state when no attachments', async ({ page }) => {
      // Override mock to return empty array
      await page.route(`**/api/commitments/${TEST_COMMITMENT_ID}/attachments`, (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] }),
          });
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.locator('[role="tab"]').filter({ hasText: 'Attachments' }).click();
      await page.waitForTimeout(1000);

      // Check for empty state
      await expect(page.getByText('No attachments yet')).toBeVisible();
    });
  });

  test('should maintain tab state when switching tabs', async ({ page }) => {
    // Navigate through all tabs
    await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('CO-001')).toBeVisible();

    await page.locator('[role="tab"]').filter({ hasText: 'Invoices' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('INV-001')).toBeVisible();

    await page.locator('[role="tab"]').filter({ hasText: 'Attachments' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('contract.pdf')).toBeVisible();

    // Go back to Change Orders - data should still be there
    await page.locator('[role="tab"]').filter({ hasText: 'Change Orders' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('CO-001')).toBeVisible();
  });
});
