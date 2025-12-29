import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../helpers/api-auth';
import { join } from 'node:path';

test.describe('Prime Contracts - Change Orders API Routes', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const storageStatePath = join(__dirname, '../..', '.auth/user.json');

  let supabase: ReturnType<typeof createClient>;
  let supabaseAdmin: ReturnType<typeof createClient>;
  let userId: string;
  let testProjectId: number;
  let testContractId: string;
  const createdChangeOrderIds: string[] = [];

  test.beforeAll(async () => {
    // Initialize Supabase clients
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (authError) throw authError;

    if (!authData.user || !authData.session) {
      throw new Error('No user or session returned from authentication');
    }

    userId = authData.user.id;

    // Get a test project (assuming project 118 exists)
    testProjectId = 118;

    // Create a test contract
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('prime_contracts')
      .insert({
        project_id: testProjectId,
        contract_number: `PC-CO-TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: 'Test Contract for Change Orders',
        status: 'active',
        original_contract_value: 100000,
        revised_contract_value: 100000,
        created_by: userId,
      })
      .select('id')
      .single();

    if (contractError || !contract) {
      throw new Error(`Failed to create test contract: ${contractError?.message}`);
    }

    testContractId = contract.id;
  });

  test.afterAll(async () => {
    // Clean up: Delete all created change orders
    if (createdChangeOrderIds.length > 0) {
      await supabaseAdmin
        .from('contract_change_orders')
        .delete()
        .in('id', createdChangeOrderIds);
    }

    // Clean up: Delete test contract
    if (testContractId) {
      await supabaseAdmin
        .from('prime_contracts')
        .delete()
        .eq('id', testContractId);
    }
  });

  test('GET should return 200 with empty array when no change orders exist', async ({ request }) => {
    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST should create change order and return 201', async ({ request }) => {
    const changeOrderData = {
      change_order_number: 'CO-001',
      description: 'Additional foundation work',
      amount: 5000,
      status: 'pending',
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders`,
      withAuth(storageStatePath, {
        data: changeOrderData,
      })
    );

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.change_order_number).toBe(changeOrderData.change_order_number);
    expect(data.description).toBe(changeOrderData.description);
    expect(data.amount).toBe(changeOrderData.amount);
    expect(data.status).toBe('pending');
    expect(data.requested_by).toBe(userId);

    createdChangeOrderIds.push(data.id);
  });

  test('POST should return 400 for duplicate change_order_number', async ({ request }) => {
    const changeOrderData = {
      change_order_number: 'CO-001', // Duplicate from previous test
      description: 'Another change order',
      amount: 3000,
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders`,
      withAuth(storageStatePath, {
        data: changeOrderData,
      })
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('already exists');
  });

  test('POST should return 400 for invalid data (missing required fields)', async ({ request }) => {
    const invalidData = {
      description: 'Missing change_order_number',
      amount: 1000,
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders`,
      withAuth(storageStatePath, {
        data: invalidData,
      })
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation error');
  });

  test('GET should return 200 with change order data', async ({ request }) => {
    const changeOrderId = createdChangeOrderIds[0];

    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(changeOrderId);
    expect(data.change_order_number).toBe('CO-001');
  });

  test('GET should return 404 for non-existent change order', async ({ request }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${nonExistentId}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('not found');
  });

  test('PUT should update change order and return 200', async ({ request }) => {
    const changeOrderId = createdChangeOrderIds[0];
    const updateData = {
      description: 'Updated foundation work description',
      amount: 5500,
    };

    const response = await request.put(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}`,
      withAuth(storageStatePath, {
        data: updateData,
      })
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.description).toBe(updateData.description);
    expect(data.amount).toBe(updateData.amount);
  });

  test('PUT should return 400 for invalid data', async ({ request }) => {
    const changeOrderId = createdChangeOrderIds[0];
    const invalidData = {
      change_order_number: '', // Empty string should fail validation
    };

    const response = await request.put(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}`,
      withAuth(storageStatePath, {
        data: invalidData,
      })
    );

    expect(response.status()).toBe(400);
  });

  test('POST /approve should approve change order and update contract value', async ({ request }) => {
    const changeOrderId = createdChangeOrderIds[0];

    // Get current contract value
    const { data: contractBefore } = await supabaseAdmin
      .from('prime_contracts')
      .select('revised_contract_value')
      .eq('id', testContractId)
      .single();

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}/approve`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('approved');
    expect(data.approved_by).toBe(userId);
    expect(data.approved_date).toBeDefined();
    expect(data.contract_updated).toBe(true);

    // Verify contract value was updated
    const expectedValue = (contractBefore?.revised_contract_value || 0) + 5500; // Updated amount from previous test
    expect(data.new_contract_value).toBe(expectedValue);

    // Verify in database
    const { data: contractAfter } = await supabaseAdmin
      .from('prime_contracts')
      .select('revised_contract_value')
      .eq('id', testContractId)
      .single();

    expect(contractAfter?.revised_contract_value).toBe(expectedValue);
  });

  test('POST /approve should return 400 if already approved', async ({ request }) => {
    const changeOrderId = createdChangeOrderIds[0];

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}/approve`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('already approved');
  });

  test('POST /reject should reject change order with reason', async ({ request }) => {
    // Create a new change order to reject
    const changeOrderData = {
      change_order_number: 'CO-002',
      description: 'Change order to be rejected',
      amount: 2000,
    };

    const createResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders`,
      withAuth(storageStatePath, {
        data: changeOrderData,
      })
    );

    const createdChangeOrder = await createResponse.json();
    createdChangeOrderIds.push(createdChangeOrder.id);

    // Reject the change order
    const rejectionData = {
      rejection_reason: 'Exceeds budget constraints',
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${createdChangeOrder.id}/reject`,
      withAuth(storageStatePath, {
        data: rejectionData,
      })
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('rejected');
    expect(data.approved_by).toBe(userId);
    expect(data.approved_date).toBeDefined();
    expect(data.rejection_reason).toBe(rejectionData.rejection_reason);
  });

  test('POST /reject should return 400 if already rejected', async ({ request }) => {
    const changeOrderId = createdChangeOrderIds[1]; // The one we just rejected

    const rejectionData = {
      rejection_reason: 'Another reason',
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}/reject`,
      withAuth(storageStatePath, {
        data: rejectionData,
      })
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('already rejected');
  });

  test('DELETE should delete change order and return 200', async ({ request }) => {
    // Create a change order to delete
    const changeOrderData = {
      change_order_number: 'CO-003',
      description: 'Change order to be deleted',
      amount: 1000,
    };

    const createResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders`,
      withAuth(storageStatePath, {
        data: changeOrderData,
      })
    );

    const createdChangeOrder = await createResponse.json();
    const changeOrderId = createdChangeOrder.id;

    const response = await request.delete(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${changeOrderId}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('deleted successfully');

    // Verify deletion
    const { data: deletedChangeOrder } = await supabaseAdmin
      .from('contract_change_orders')
      .select('id')
      .eq('id', changeOrderId)
      .single();

    expect(deletedChangeOrder).toBeNull();
  });

  test('DELETE should return 404 for non-existent change order', async ({ request }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request.delete(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/change-orders/${nonExistentId}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('not found');
  });
});
