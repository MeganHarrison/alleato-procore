import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DirectoryService } from '@/services/directoryService';
import { PermissionService } from '@/services/permissionService';

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionService = new PermissionService(supabase);
    const hasWrite = await permissionService.hasPermission(user.id, projectId, 'directory', 'write');

    if (!hasWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const directoryService = new DirectoryService(supabase);
    const person = await directoryService.updatePerson(projectId, userId, body);

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating directory user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionService = new PermissionService(supabase);
    const hasWrite = await permissionService.hasPermission(user.id, projectId, 'directory', 'write');

    if (!hasWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const directoryService = new DirectoryService(supabase);
    await directoryService.deactivatePerson(projectId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing directory user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
