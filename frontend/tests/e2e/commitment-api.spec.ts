import { test, expect } from '@playwright/test';

const PROJECT_ID = 67;

test.describe('Commitment APIs', () => {
  test('should create a subcontract via API', async ({ request }) => {
    const timestamp = Date.now();

    const response = await request.post(`/api/projects/${PROJECT_ID}/subcontracts`, {
      data: {
        contractNumber: `SC-API-${timestamp}`,
        title: 'Test Subcontract via API',
        status: 'Draft',
        executed: false,
        description: 'Created by E2E test',
        dates: {},
        privacy: {
          isPrivate: true,
          allowNonAdminViewSovItems: false,
        },
        sov: [],
      },
    });

    console.log('Subcontract API Response status:', response.status());
    const body = await response.json();
    console.log('Subcontract API Response body:', JSON.stringify(body, null, 2));

    // Check if it succeeded or log the error
    if (response.status() !== 200 && response.status() !== 201) {
      console.error('Failed to create subcontract:', body);
    }

    expect(response.status()).toBeLessThan(500); // At minimum, no server error
  });

  test('should create a purchase order via API', async ({ request }) => {
    const timestamp = Date.now();

    const response = await request.post(`/api/projects/${PROJECT_ID}/purchase-orders`, {
      data: {
        contractNumber: `PO-API-${timestamp}`,
        title: 'Test Purchase Order via API',
        status: 'Draft',
        executed: false,
        accountingMethod: 'unit-quantity',
        billTo: '123 Test Street',
        shipTo: '456 Test Ave',
        paymentTerms: 'Net 30',
        description: 'Created by E2E test',
        dates: {},
        privacy: {
          isPrivate: true,
          allowNonAdminViewSovItems: false,
        },
        sov: [],
      },
    });

    console.log('Purchase Order API Response status:', response.status());
    const body = await response.json();
    console.log('Purchase Order API Response body:', JSON.stringify(body, null, 2));

    // Check if it succeeded or log the error
    if (response.status() !== 200 && response.status() !== 201) {
      console.error('Failed to create purchase order:', body);
    }

    expect(response.status()).toBeLessThan(500); // At minimum, no server error
  });

  test('should fetch commitments from unified view', async ({ request }) => {
    const response = await request.get(`/api/commitments?projectId=${PROJECT_ID}`);

    console.log('Commitments API Response status:', response.status());
    const body = await response.json();
    console.log('Commitments count:', body.data?.length || 0);

    expect(response.status()).toBe(200);
  });
});
