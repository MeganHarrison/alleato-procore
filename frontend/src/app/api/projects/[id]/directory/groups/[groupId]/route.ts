import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DistributionGroupService } from '@/services/distributionGroupService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

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