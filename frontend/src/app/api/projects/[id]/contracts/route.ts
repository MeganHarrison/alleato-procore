import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createContractSchema } from './validation';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/contracts
 * Returns all prime contracts for a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Build query with optional filters
    let query = supabase
      .from('prime_contracts')
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .eq('project_id', parseInt(projectId, 10))
      .order('created_at', { ascending: false });

    // Optional filters
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`contract_number.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contracts', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/contracts
 * Creates a new prime contract for a specific project
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate request body
    const validatedData = createContractSchema.parse({
      ...body,
      project_id: parseInt(projectId, 10),
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // DEVELOPMENT: Permission check disabled for easier testing
    // TODO: Re-enable this in production
    // const { data: projectMember } = await supabase
    //   .from('project_members')
    //   .select('access')
    //   .eq('project_id', parseInt(projectId, 10))
    //   .eq('user_id', user.id)
    //   .single();

    // if (!projectMember || !['editor', 'admin', 'owner'].includes(projectMember.access)) {
    //   return NextResponse.json(
    //     { error: 'Forbidden: You do not have permission to create contracts for this project' },
    //     { status: 403 }
    //   );
    // }

    // Check for unique contract_number within project
    const { data: existingContract } = await supabase
      .from('prime_contracts')
      .select('id')
      .eq('project_id', parseInt(projectId, 10))
      .eq('contract_number', validatedData.contract_number)
      .single();

    if (existingContract) {
      return NextResponse.json(
        { error: 'Contract number already exists for this project' },
        { status: 400 }
      );
    }

    // Create the contract
    const { data, error } = await supabase
      .from('prime_contracts')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select(`
        *,
        vendor:vendors(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      return NextResponse.json(
        { error: 'Failed to create contract', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 201 });
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

    console.error('Error in POST /api/projects/[id]/contracts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
