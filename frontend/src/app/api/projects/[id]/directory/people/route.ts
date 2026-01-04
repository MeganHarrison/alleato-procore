import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DirectoryService } from '@/services/directoryService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const permissionService = new PermissionService(supabase);
    const hasPermission = await permissionService.hasPermission(
      user.id,
      params.projectId,
      'directory',
      'read'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') as 'user' | 'contact' | 'all' | undefined,
      status: searchParams.get('status') as 'active' | 'inactive' | 'all' | undefined,
      companyId: searchParams.get('company_id') || undefined,
      permissionTemplateId: searchParams.get('permission_template_id') || undefined,
      groupBy: searchParams.get('group_by') as 'company' | 'none' | undefined,
      sortBy: searchParams.get('sort')?.split(',') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('per_page') || '50')
    };

    // Get people
    const directoryService = new DirectoryService(supabase);
    const result = await directoryService.getPeople(params.projectId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching directory people:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const permissionService = new PermissionService(supabase);
    const hasPermission = await permissionService.hasPermission(
      user.id,
      params.projectId,
      'directory',
      'write'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.first_name || !body.last_name || !body.person_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create person
    const directoryService = new DirectoryService(supabase);
    const person = await directoryService.createPerson(params.projectId, body);

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}