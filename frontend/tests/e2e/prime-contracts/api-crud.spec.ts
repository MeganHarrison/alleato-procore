import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * E2E Tests for Prime Contracts API Routes
 * Tests CRUD operations via REST API endpoints
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe('Prime Contracts API CRUD', () => {
  let supabase: ReturnType<typeof createClient>;
  let supabaseAdmin: ReturnType<typeof createClient>;
  let testProjectId: number;
  let testUserId: string;
  let accessToken: string;
  let createdContractIds: string[] = [];

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
    accessToken = authData.session.access_token;

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
  });

  test.afterAll(async () => {
    // Clean up: Delete all created contracts
    if (createdContractIds.length > 0) {
      await supabaseAdmin
        .from('prime_contracts')
        .delete()
        .in('id', createdContractIds);
    }
  });

  test('GET /api/projects/[id]/contracts should return 200 with array', async ({ request }) => {
    const response = await request.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/projects/[id]/contracts should create contract and return 201', async ({ request }) => {
    const contractData = {
      contract_number: `PC-TEST-${Date.now()}`,
      title: 'Test Prime Contract',
      original_contract_value: 100000,
      revised_contract_value: 100000,
      status: 'draft',
      retention_percentage: 10,
    };

    const response = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.contract_number).toBe(contractData.contract_number);
    expect(data.title).toBe(contractData.title);
    expect(data.original_contract_value).toBe(contractData.original_contract_value);
    expect(data.status).toBe('draft');
    expect(data.project_id).toBe(testProjectId);
    expect(data.created_by).toBe(testUserId);

    // Track for cleanup
    createdContractIds.push(data.id);
  });

  test('POST should return 400 for invalid data (missing required fields)', async ({ request }) => {
    const invalidData = {
      title: 'Missing contract number',
    };

    const response = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: invalidData,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation error');
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });

  test('POST should return 400 for duplicate contract_number in same project', async ({ request }) => {
    const contractData = {
      contract_number: `PC-DUPLICATE-${Date.now()}`,
      title: 'First Contract',
      original_contract_value: 50000,
    };

    // Create first contract
    const firstResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    expect(firstResponse.status()).toBe(201);
    const firstData = await firstResponse.json();
    createdContractIds.push(firstData.id);

    // Try to create second contract with same contract_number
    const secondResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    expect(secondResponse.status()).toBe(400);

    const errorData = await secondResponse.json();
    expect(errorData.error).toContain('Contract number already exists');
  });

  test('GET /api/projects/[id]/contracts/[contractId] should return 200 with contract data', async ({ request }) => {
    // Create a contract first
    const contractData = {
      contract_number: `PC-GET-${Date.now()}`,
      title: 'Test Get Contract',
      original_contract_value: 75000,
    };

    const createResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    const createdContract = await createResponse.json();
    createdContractIds.push(createdContract.id);

    // Now get the contract
    const response = await request.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${createdContract.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(createdContract.id);
    expect(data.contract_number).toBe(contractData.contract_number);
    expect(data.title).toBe(contractData.title);
  });

  test('GET /api/projects/[id]/contracts/[contractId] should return 404 for non-existent contract', async ({ request }) => {
    const fakeContractId = '00000000-0000-0000-0000-000000000000';

    const response = await request.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${fakeContractId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toContain('Contract not found');
  });

  test('PUT /api/projects/[id]/contracts/[contractId] should update contract and return 200', async ({ request }) => {
    // Create a contract first
    const contractData = {
      contract_number: `PC-UPDATE-${Date.now()}`,
      title: 'Original Title',
      original_contract_value: 80000,
    };

    const createResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    const createdContract = await createResponse.json();
    createdContractIds.push(createdContract.id);

    // Update the contract
    const updateData = {
      title: 'Updated Title',
      status: 'active',
      revised_contract_value: 85000,
    };

    const response = await request.put(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${createdContract.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: updateData,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.id).toBe(createdContract.id);
    expect(data.title).toBe('Updated Title');
    expect(data.status).toBe('active');
    expect(data.revised_contract_value).toBe(85000);
    expect(data.updated_at).not.toBe(createdContract.updated_at);
  });

  test('PUT should return 400 for invalid data', async ({ request }) => {
    // Create a contract first
    const contractData = {
      contract_number: `PC-INVALID-UPDATE-${Date.now()}`,
      title: 'Test Contract',
      original_contract_value: 60000,
    };

    const createResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    const createdContract = await createResponse.json();
    createdContractIds.push(createdContract.id);

    // Try to update with invalid data
    const invalidUpdateData = {
      retention_percentage: 150, // Invalid: must be 0-100
    };

    const response = await request.put(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${createdContract.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: invalidUpdateData,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Validation error');
  });

  test('DELETE /api/projects/[id]/contracts/[contractId] should delete contract and return 200', async ({ request }) => {
    // Create a contract first
    const contractData = {
      contract_number: `PC-DELETE-${Date.now()}`,
      title: 'Contract to Delete',
      original_contract_value: 70000,
    };

    const createResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    const createdContract = await createResponse.json();

    // Update user to admin for delete permission
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'admin' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);

    // Delete the contract
    const response = await request.delete(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${createdContract.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.message).toContain('deleted successfully');

    // Verify contract is deleted
    const verifyResponse = await request.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${createdContract.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(verifyResponse.status()).toBe(404);

    // Reset user back to editor
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'editor' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);
  });

  test('DELETE should return 404 for non-existent contract', async ({ request }) => {
    const fakeContractId = '00000000-0000-0000-0000-000000000000';

    // Update user to admin for delete permission
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'admin' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);

    const response = await request.delete(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts/${fakeContractId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(404);

    // Reset user back to editor
    await supabaseAdmin
      .from('project_members')
      .update({ access: 'editor' })
      .eq('project_id', testProjectId)
      .eq('user_id', testUserId);
  });

  test('GET /api/projects/[id]/contracts should support status filter', async ({ request }) => {
    // Create contracts with different statuses
    const activeContract = {
      contract_number: `PC-FILTER-ACTIVE-${Date.now()}`,
      title: 'Active Contract',
      original_contract_value: 50000,
      status: 'active',
    };

    const draftContract = {
      contract_number: `PC-FILTER-DRAFT-${Date.now()}`,
      title: 'Draft Contract',
      original_contract_value: 60000,
      status: 'draft',
    };

    const createActive = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: activeContract,
    });

    const createDraft = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: draftContract,
    });

    const activeData = await createActive.json();
    const draftData = await createDraft.json();
    createdContractIds.push(activeData.id, draftData.id);

    // Filter by active status
    const response = await request.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts?status=active`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    // Verify all returned contracts have active status
    const allActive = data.every((contract: { status: string }) => contract.status === 'active');
    expect(allActive).toBe(true);

    // Verify our created contract is in the results
    const foundContract = data.find((c: { id: string }) => c.id === activeData.id);
    expect(foundContract).toBeDefined();
  });

  test('GET /api/projects/[id]/contracts should support search query', async ({ request }) => {
    const uniqueTitle = `Unique Search Test ${Date.now()}`;
    const contractData = {
      contract_number: `PC-SEARCH-${Date.now()}`,
      title: uniqueTitle,
      original_contract_value: 55000,
    };

    const createResponse = await request.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: contractData,
    });

    const createdContract = await createResponse.json();
    createdContractIds.push(createdContract.id);

    // Search for the contract
    const response = await request.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${testProjectId}/contracts?search=${encodeURIComponent(uniqueTitle)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);

    // Verify our created contract is in the results
    const foundContract = data.find((c: { id: string }) => c.id === createdContract.id);
    expect(foundContract).toBeDefined();
    expect(foundContract.title).toBe(uniqueTitle);
  });
});
