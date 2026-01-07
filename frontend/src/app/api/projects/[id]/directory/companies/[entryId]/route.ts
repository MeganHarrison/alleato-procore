import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DirectoryService } from '@/services/directoryService';
import { PermissionService } from '@/services/permissionService';

interface RouteParams {
  params: Promise<{ id: string; entryId: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, entryId } = await params;
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

    const payload = await request.json();
    const updates: Record<string, unknown> = {};

    if (payload.is_active !== undefined) {
      updates.is_active = Boolean(payload.is_active);
    }

    if (typeof payload.role === 'string') {
      updates.role = payload.role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const directoryService = new DirectoryService(supabase);
    const entry = await directoryService.updateCompanyEntry(projectId, entryId, updates);

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating directory company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId, entryId } = await params;
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
    await directoryService.deleteCompanyEntry(projectId, entryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting directory company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
