import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InviteService } from '@/services/inviteService';
import { PermissionService } from '@/services/permissionService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionService = new PermissionService(supabase);
    const canWrite = await permissionService.hasPermission(user.id, projectId, 'directory', 'write');

    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const personId = body?.personId as string | undefined;
    const reinvite = Boolean(body?.reinvite);

    if (!personId) {
      return NextResponse.json({ error: 'Missing personId' }, { status: 400 });
    }

    const inviteService = new InviteService(supabase);
    const result = reinvite
      ? await inviteService.resendInvite(projectId, personId)
      : await inviteService.sendInvite(projectId, personId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Unable to send invite' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending directory invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
