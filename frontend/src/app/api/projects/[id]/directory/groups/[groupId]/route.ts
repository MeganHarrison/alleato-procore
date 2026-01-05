import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DistributionGroupService } from '@/services/distributionGroupService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

/**
 * Retrieve a distribution group for a project after authenticating the requester and verifying read permission.
 *
 * Returns a JSON NextResponse containing the requested distribution group on success.
 *
 * Possible error responses:
 * - 401: when the requester is not authenticated
 * - 403: when the requester lacks read permission for the project's directory
 * - 500: on unexpected server errors
 *
 * @returns A NextResponse with the distribution group object on success, or a JSON error object with an appropriate HTTP status code on failure.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; groupId: string } }
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

    // Get group
    const groupService = new DistributionGroupService(supabase);
    const group = await groupService.getGroup(params.groupId, true);

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching distribution group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Updates a distribution group within a project after verifying the caller's admin permission.
 *
 * @param request - Incoming request whose JSON body contains the update fields for the group.
 * @param params - Route parameters.
 * @param params.projectId - ID of the project containing the group.
 * @param params.groupId - ID of the distribution group to update.
 * @returns The updated distribution group object.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; groupId: string } }
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
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Update group
    const groupService = new DistributionGroupService(supabase);
    const group = await groupService.updateGroup(params.groupId, body);

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error updating distribution group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Deletes a distribution group within a project's directory when the authenticated user has admin permission.
 *
 * @param request - The incoming HTTP request
 * @param params.projectId - The ID of the project containing the directory
 * @param params.groupId - The ID of the distribution group to delete
 * @returns A JSON HTTP response: `{ success: true }` on successful deletion, or an error object with status `401` (unauthorized), `403` (forbidden), or `500` (internal server error)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; groupId: string } }
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
      'admin'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete group
    const groupService = new DistributionGroupService(supabase);
    await groupService.deleteGroup(params.groupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting distribution group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}