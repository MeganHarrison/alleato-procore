import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DirectoryService } from '@/services/directoryService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

/**
 * Retrieve a person from a project's directory by project and person IDs.
 *
 * @param request - The incoming Next.js request
 * @param params - Route parameters
 * @param params.projectId - The project identifier to scope the directory lookup
 * @param params.personId - The person identifier within the project's directory
 * @returns A NextResponse containing the person object on success; returns a JSON error with status 401 if the requester is unauthorized, 403 if the requester lacks directory read permission, or 500 on internal server error
 */
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

/**
 * Update a person in a project's directory.
 *
 * @param request - The incoming Next.js request whose JSON body contains fields to update on the person.
 * @param params - Route parameters.
 * @param params.projectId - ID of the project containing the directory.
 * @param params.personId - ID of the person to update.
 * @returns The updated person object, or an error payload on failure. 
 */
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

/**
 * Deactivates (soft-deletes) a person in a project's directory after verifying the requester is authenticated and has write permission.
 *
 * @param request - The incoming NextRequest
 * @param params.projectId - ID of the project containing the person
 * @param params.personId - ID of the person to deactivate
 * @returns JSON response: `{ success: true }` on success; on failure returns an error JSON with HTTP status `401` (unauthorized), `403` (forbidden), or `500` (internal server error)
 */
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