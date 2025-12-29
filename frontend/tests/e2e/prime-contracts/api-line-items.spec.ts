import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../helpers/api-auth';
import { join } from 'node:path';

/**
 * E2E Tests for Contract Line Items API Routes
 * Tests CRUD operations via REST API endpoints
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const storageStatePath = join(__dirname, '../..', '.auth/user.json');

test.describe('Contract Line Items API CRUD', () => {
  let supabase: ReturnType<typeof createClient>;
  let supabaseAdmin: ReturnType<typeof createClient>;
  let testProjectId: number;
  let testUserId: string;
  let testContractId: string;
  let createdLineItemIds: string[] = [];

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

    testUserId = authData.user.id;

    // Get test project
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);

    if (error) throw error;
    if (!projects || projects.length === 0) {
      throw new Error('No test project found');
    }
    testProjectId = projects[0].id;

    // Ensure test user is a member of the project with editor access
    await supabaseAdmin
      .from('project_members')
      .upsert({
        project_id: testProjectId,
        user_id: testUserId,
        access: 'editor',
      }, {
        onConflict: 'project_id,user_id',
      });

    // Create a test contract for line items
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('prime_contracts')
      .insert({
        project_id: testProjectId,
        contract_number: `PC-LINEITEMS-${Date.now()}`,
        title: 'Test Contract for Line Items',
        original_contract_value: 100000,
        revised_contract_value: 100000,
        status: 'active',
      })
      .select()
      .single();

    if (contractError) {
      throw new Error(`Failed to create test contract: ${contractError.message}`);
    }

    if (!contract) {
      throw new Error('Failed to create test contract');
    }

    testContractId = contract.id;
  });

  test.afterAll(async () => {
    // Clean up: Delete all created line items
    if (createdLineItemIds.length > 0) {
      await supabaseAdmin
        .from('contract_line_items')
        .delete()
        .in('id', createdLineItemIds);
    }

    // Clean up test contract
    if (testContractId) {
      await supabaseAdmin
        .from('prime_contracts')
        .delete()
        .eq('id', testContractId);
    }
  });

  test('GET /api/projects/[id]/contracts/[contractId]/line-items should return 200 with array', async ({ request }) => {
    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/projects/[id]/contracts/[contractId]/line-items should create line item and return 201', async ({ request }) => {
    const lineItemData = {
      line_number: 1,
      description: 'Test Line Item 1',
      quantity: 10,
      unit_of_measure: 'EA',
      unit_cost: 100.50,
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.line_number).toBe(lineItemData.line_number);
    expect(data.description).toBe(lineItemData.description);
    expect(data.quantity).toBe(lineItemData.quantity);
    expect(data.unit_cost).toBe(lineItemData.unit_cost);
    expect(data.total_cost).toBe(lineItemData.quantity * lineItemData.unit_cost); // Auto-calculated
    expect(data.contract_id).toBe(testContractId);

    // Track for cleanup
    createdLineItemIds.push(data.id);
  });

  test('POST should verify total_cost auto-calculation', async ({ request }) => {
    const lineItemData = {
      line_number: 2,
      description: 'Auto-calc Test',
      quantity: 5,
      unit_cost: 25.75,
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.total_cost).toBe(128.75); // 5 * 25.75
    createdLineItemIds.push(data.id);
  });

  test('POST should return 400 for invalid data (missing required fields)', async ({ request }) => {
    const invalidData = {
      description: 'Missing line number',
    };

    const response = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: invalidData,
      })
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation error');
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });

  test('POST should return 400 for duplicate line_number in same contract', async ({ request }) => {
    const lineItemData = {
      line_number: 100,
      description: 'First item',
      quantity: 1,
      unit_cost: 50,
    };

    // Create first line item
    const firstResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    expect(firstResponse.status()).toBe(201);
    const firstData = await firstResponse.json();
    createdLineItemIds.push(firstData.id);

    // Try to create second line item with same line_number
    const secondResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    expect(secondResponse.status()).toBe(400);

    const errorData = await secondResponse.json();
    expect(errorData.error).toContain('Line number already exists');
  });

  test('GET /api/projects/[id]/contracts/[contractId]/line-items/[lineItemId] should return 200 with line item data', async ({ request }) => {
    // Create a line item first
    const lineItemData = {
      line_number: 3,
      description: 'Test Get Line Item',
      quantity: 7,
      unit_cost: 15.25,
    };

    const createResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    const createdLineItem = await createResponse.json();
    createdLineItemIds.push(createdLineItem.id);

    // Now get the line item
    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${createdLineItem.id}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(createdLineItem.id);
    expect(data.line_number).toBe(lineItemData.line_number);
    expect(data.description).toBe(lineItemData.description);
  });

  test('GET /api/projects/[id]/contracts/[contractId]/line-items/[lineItemId] should return 404 for non-existent line item', async ({ request }) => {
    const fakeLineItemId = '00000000-0000-0000-0000-000000000000';

    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${fakeLineItemId}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('Line item not found');
  });

  test('PUT /api/projects/[id]/contracts/[contractId]/line-items/[lineItemId] should update line item and return 200', async ({ request }) => {
    // Create a line item first
    const lineItemData = {
      line_number: 4,
      description: 'Original Description',
      quantity: 3,
      unit_cost: 20,
    };

    const createResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    const createdLineItem = await createResponse.json();
    createdLineItemIds.push(createdLineItem.id);

    // Update the line item
    const updateData = {
      description: 'Updated Description',
      quantity: 5,
      unit_cost: 30,
    };

    const response = await request.put(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${createdLineItem.id}`,
      withAuth(storageStatePath, {
        data: updateData,
      })
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(createdLineItem.id);
    expect(data.description).toBe('Updated Description');
    expect(data.quantity).toBe(5);
    expect(data.unit_cost).toBe(30);
    expect(data.total_cost).toBe(150); // 5 * 30 (auto-recalculated)
    expect(data.updated_at).not.toBe(createdLineItem.updated_at);
  });

  test('PUT should return 400 for invalid data', async ({ request }) => {
    // Create a line item first
    const lineItemData = {
      line_number: 5,
      description: 'Test Item',
      quantity: 2,
      unit_cost: 10,
    };

    const createResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    const createdLineItem = await createResponse.json();
    createdLineItemIds.push(createdLineItem.id);

    // Try to update with invalid data
    const invalidUpdateData = {
      quantity: -5, // Invalid: must be >= 0
    };

    const response = await request.put(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${createdLineItem.id}`,
      withAuth(storageStatePath, {
        data: invalidUpdateData,
      })
    );

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation error');
  });

  test('DELETE /api/projects/[id]/contracts/[contractId]/line-items/[lineItemId] should delete line item and return 200', async ({ request }) => {
    // Create a line item first
    const lineItemData = {
      line_number: 6,
      description: 'Item to Delete',
      quantity: 1,
      unit_cost: 25,
    };

    const createResponse = await request.post(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath, {
        data: lineItemData,
      })
    );

    const createdLineItem = await createResponse.json();

    // Update user to admin for delete permission
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'admin' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);

    // Delete the line item
    const response = await request.delete(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${createdLineItem.id}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('deleted successfully');

    // Verify line item is deleted
    const verifyResponse = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${createdLineItem.id}`,
      withAuth(storageStatePath)
    );

    expect(verifyResponse.status()).toBe(404);

    // Reset user back to editor
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'editor' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);
  });

  test('DELETE should return 404 for non-existent line item', async ({ request }) => {
    const fakeLineItemId = '00000000-0000-0000-0000-000000000000';

    // Update user to admin for delete permission
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'admin' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);

    const response = await request.delete(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items/${fakeLineItemId}`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(404);

    // Reset user back to editor
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'editor' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);
  });

  test('GET /api/projects/[id]/contracts/[contractId]/line-items should return all line items ordered by line_number', async ({ request }) => {
    // Create multiple line items
    const lineItems = [
      { line_number: 10, description: 'Item 10', quantity: 1, unit_cost: 10 },
      { line_number: 5, description: 'Item 5', quantity: 1, unit_cost: 5 },
      { line_number: 15, description: 'Item 15', quantity: 1, unit_cost: 15 },
    ];

    for (const item of lineItems) {
      const createResponse = await request.post(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
        withAuth(storageStatePath, {
          data: item,
        })
      );

      const createdItem = await createResponse.json();
      createdLineItemIds.push(createdItem.id);
    }

    // Get all line items
    const response = await request.get(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${testContractId}/line-items`,
      withAuth(storageStatePath)
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);

    // Verify they are ordered by line_number ascending
    const ourItems = data.filter((item: { line_number: number }) =>
      [5, 10, 15].includes(item.line_number)
    );

    expect(ourItems.length).toBe(3);
    expect(ourItems[0].line_number).toBe(5);
    expect(ourItems[1].line_number).toBe(10);
    expect(ourItems[2].line_number).toBe(15);
  });
});
