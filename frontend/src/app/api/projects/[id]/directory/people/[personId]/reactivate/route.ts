import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DirectoryService } from '@/services/directoryService';
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

    // Reactivate person
    const directoryService = new DirectoryService(supabase);
    await directoryService.reactivatePerson(params.projectId, params.personId);

    return NextResponse.json({ 
      success: true,
      message: 'Person reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}