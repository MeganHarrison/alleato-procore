import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { InviteService } from '@/services/inviteService';
import { PermissionService } from '@/services/permissionService';
import type { Database } from '@/types/database.types';

export async function POST(
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

    // Send invite
    const inviteService = new InviteService(supabase);
    const result = await inviteService.sendInvite(params.projectId, params.personId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send invite' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}