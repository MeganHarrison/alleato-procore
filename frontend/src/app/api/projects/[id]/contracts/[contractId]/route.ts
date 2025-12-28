import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateContractSchema } from '../validation';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; contractId: string }>;
}

/**
 * GET /api/projects/[id]/contracts/[contractId]
 * Returns a single prime contract by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, contractId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('prime_contracts')
      .select(`
        *,
        vendor:vendors(id, name, contact_name, contact_email, contact_phone)
      `)
      .eq('id', contractId)
      .eq('project_id', parseInt(projectId, 10))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Contract not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching contract:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contract', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/contracts/[contractId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/contracts/[contractId]
 * Updates a prime contract
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, contractId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate request body
    const validatedData = updateContractSchema.parse(body);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has access to this project
    const { data: projectMember } = await supabase
      .from('project_members')
      .select('access')
      .eq('project_id', parseInt(projectId, 10))
      .eq('user_id', user.id)
      .single();

    if (!projectMember || !['editor', 'admin', 'owner'].includes(projectMember.access)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update contracts for this project' },
        { status: 403 }
      );
    }

    // Check if contract exists and belongs to this project
    const { data: existingContract } = await supabase
      .from('prime_contracts')
      .select('id, contract_number')
      .eq('id', contractId)
      .eq('project_id', parseInt(projectId, 10))
      .single();

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // If updating contract_number, check for uniqueness
    if (validatedData.contract_number && validatedData.contract_number !== existingContract.contract_number) {
      const { data: duplicateContract } = await supabase
        .from('prime_contracts')
        .select('id')
        .eq('project_id', parseInt(projectId, 10))
        .eq('contract_number', validatedData.contract_number)
        .neq('id', contractId)
        .single();

      if (duplicateContract) {
        return NextResponse.json(
          { error: 'Contract number already exists for this project' },
          { status: 400 }
        );
      }
    }

    // Update the contract
    const { data, error } = await supabase
      .from('prime_contracts')
      .update(validatedData)
      .eq('id', contractId)
      .eq('project_id', parseInt(projectId, 10))
      .select(`
        *,
        vendor:vendors(id, name, contact_name, contact_email, contact_phone)
      `)
      .single();

    if (error) {
      console.error('Error updating contract:', error);
      return NextResponse.json(
        { error: 'Failed to update contract', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/projects/[id]/contracts/[contractId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/contracts/[contractId]
 * Deletes a prime contract
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, contractId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin/owner access to this project
    const { data: projectMember } = await supabase
      .from('project_members')
      .select('access')
      .eq('project_id', parseInt(projectId, 10))
      .eq('user_id', user.id)
      .single();

    if (!projectMember || !['admin', 'owner'].includes(projectMember.access)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete contracts for this project' },
        { status: 403 }
      );
    }

    // Check for related records before deletion
    const { data: relatedLineItems } = await supabase
      .from('contract_line_items')
      .select('id')
      .eq('contract_id', contractId)
      .limit(1);

    if (relatedLineItems && relatedLineItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete contract with existing line items. Please delete related line items first.' },
        { status: 400 }
      );
    }

    const { data: relatedChangeOrders } = await supabase
      .from('contract_change_orders')
      .select('id')
      .eq('contract_id', contractId)
      .limit(1);

    if (relatedChangeOrders && relatedChangeOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete contract with existing change orders. Please delete related change orders first.' },
        { status: 400 }
      );
    }

    const { data: relatedBillingPeriods } = await supabase
      .from('contract_billing_periods')
      .select('id')
      .eq('contract_id', contractId)
      .limit(1);

    if (relatedBillingPeriods && relatedBillingPeriods.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete contract with existing billing periods. Please delete related billing periods first.' },
        { status: 400 }
      );
    }

    // Check if contract exists before deleting
    const { data: existingContract } = await supabase
      .from('prime_contracts')
      .select('id')
      .eq('id', contractId)
      .eq('project_id', parseInt(projectId, 10))
      .single();

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Delete the contract
    const { error } = await supabase
      .from('prime_contracts')
      .delete()
      .eq('id', contractId)
      .eq('project_id', parseInt(projectId, 10));

    if (error) {
      console.error('Error deleting contract:', error);
      return NextResponse.json(
        { error: 'Failed to delete contract', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Contract deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/contracts/[contractId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
