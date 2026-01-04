import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DistributionGroupService } from '@/services/distributionGroupService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

export async function POST(
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

    // Handle bulk operations
    const groupService = new DistributionGroupService(supabase);
    
    if (body.add || body.remove) {
      // Bulk update members
      await groupService.updateMembers(params.groupId, {
        add: body.add,
        remove: body.remove
      });
    } else if (body.person_ids) {
      // Add multiple members
      await groupService.addMembers(params.groupId, body.person_ids);
    } else if (body.person_id) {
      // Add single member
      await groupService.addMembers(params.groupId, [body.person_id]);
    } else {
      return NextResponse.json(
        { error: 'No members specified' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating group members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}