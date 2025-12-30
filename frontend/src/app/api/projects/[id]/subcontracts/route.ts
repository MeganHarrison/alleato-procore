import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateSubcontractSchema } from '@/lib/schemas/create-subcontract-schema';

/**
 * GET /api/projects/[id]/subcontracts
 * Fetch all subcontracts for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch subcontracts with totals view
    const { data, error } = await supabase
      .from('subcontracts_with_totals')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subcontracts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subcontracts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/subcontracts
 * Create a new subcontract
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateSubcontractSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Start a transaction by creating the subcontract first
    const subcontractData = {
      project_id: parseInt(projectId),
      contract_number: data.contractNumber || undefined,
      contract_company_id: data.contractCompanyId || null,
      title: data.title || null,
      status: data.status || 'Draft',
      executed: data.executed ?? false,
      default_retainage_percent: data.defaultRetainagePercent?.toString() || null,
      description: data.description || null,
      inclusions: data.inclusions || null,
      exclusions: data.exclusions || null,
      start_date: data.dates?.startDate || null,
      estimated_completion_date: data.dates?.estimatedCompletionDate || null,
      actual_completion_date: data.dates?.actualCompletionDate || null,
      contract_date: data.dates?.contractDate || null,
      signed_contract_received_date: data.dates?.signedContractReceivedDate || null,
      issued_on_date: data.dates?.issuedOnDate || null,
      is_private: data.privacy?.isPrivate ?? true,
      non_admin_user_ids: data.privacy?.nonAdminUserIds || [],
      allow_non_admin_view_sov_items: data.privacy?.allowNonAdminViewSovItems ?? false,
      invoice_contact_ids: data.invoiceContacts || [],
      created_by: user.id,
    };

    const { data: subcontract, error: subcontractError } = await supabase
      .from('subcontracts')
      .insert(subcontractData)
      .select()
      .single();

    if (subcontractError) {
      console.error('Error creating subcontract:', subcontractError);
      return NextResponse.json(
        { error: 'Failed to create subcontract', details: subcontractError.message },
        { status: 500 }
      );
    }

    // Create SOV line items if provided
    if (data.sov && data.sov.length > 0) {
      const sovItems = data.sov.map((item, index) => ({
        subcontract_id: subcontract.id,
        line_number: item.lineNumber || index + 1,
        change_event_line_item: item.changeEventLineItem || null,
        budget_code: item.budgetCode || null,
        description: item.description || null,
        amount: item.amount?.toString() || '0',
        billed_to_date: item.billedToDate?.toString() || '0',
        sort_order: index,
      }));

      const { error: sovError } = await supabase
        .from('subcontract_sov_items')
        .insert(sovItems);

      if (sovError) {
        console.error('Error creating SOV items:', sovError);
        // Rollback: delete the subcontract we just created
        await supabase.from('subcontracts').delete().eq('id', subcontract.id);
        return NextResponse.json(
          { error: 'Failed to create SOV items', details: sovError.message },
          { status: 500 }
        );
      }
    }

    // Fetch the complete subcontract with totals
    const { data: completeSubcontract, error: fetchError } = await supabase
      .from('subcontracts_with_totals')
      .select('*')
      .eq('id', subcontract.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete subcontract:', fetchError);
      // Don't fail here, we already created successfully
      return NextResponse.json({
        data: subcontract,
        message: 'Subcontract created successfully',
      });
    }

    return NextResponse.json({
      data: completeSubcontract,
      message: 'Subcontract created successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
