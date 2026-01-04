import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DirectoryService } from '@/services/directoryService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; personId: string } }
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

    // Get person
    const directoryService = new DirectoryService(supabase);
    const person = await directoryService.getPerson(params.projectId, params.personId);

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; personId: string } }
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

    // Update person
    const directoryService = new DirectoryService(supabase);
    const person = await directoryService.updatePerson(
      params.projectId,
      params.personId,
      body
    );

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; personId: string } }
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

    // Soft delete by deactivating
    const directoryService = new DirectoryService(supabase);
    await directoryService.deactivatePerson(params.projectId, params.personId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}