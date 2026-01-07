import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DirectoryService } from '@/services/directoryService';
import { PermissionService } from '@/services/permissionService';
import type { DirectoryFilters, DirectoryPermissions } from '@/types/directory';
import type { Database } from '@/types/database.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

type MembershipWithPerson = Database['public']['Tables']['project_directory_memberships']['Row'] & {
  person?: Database['public']['Tables']['people']['Row'] & {
    company?: Database['public']['Tables']['companies']['Row'] | null;
    users_auth?: { auth_user_id: string }[];
  } | null;
};

const EMPTY_PERMISSIONS: DirectoryPermissions = {
  canRead: false,
  canInvite: false,
  canEdit: false,
  canRemove: false
};

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function getVisibilityContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string
) {
  const projectIdNum = Number.parseInt(projectId, 10);
  const { data } = await supabase
    .from('project_directory_memberships')
    .select(`
      *,
      person:people!inner(
        *,
        company:companies(*),
        users_auth!inner(auth_user_id)
      )
    `)
    .eq('project_id', projectIdNum)
    .eq('person.users_auth.auth_user_id', userId)
    .maybeSingle();

  const membership = data as MembershipWithPerson | null;
  const company = membership?.person?.company;
  const companyId = membership?.person?.company_id ?? company?.id ?? undefined;
  const companyType = company?.type?.toLowerCase();

  return {
    isInternalUser: companyType ? companyType === 'internal' : true,
    companyId
  };
}

export async function GET(
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
    const canRead = await permissionService.hasPermission(user.id, projectId, 'directory', 'read');

    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [canWrite, canAdmin] = await Promise.all([
      permissionService.hasPermission(user.id, projectId, 'directory', 'write'),
      permissionService.hasPermission(user.id, projectId, 'directory', 'admin')
    ]);

    const permissions: DirectoryPermissions = {
      canRead,
      canInvite: canWrite,
      canEdit: canWrite || canAdmin,
      canRemove: canWrite || canAdmin
    };

    const searchParams = request.nextUrl.searchParams;
    const entity = searchParams.get('entity') || 'people';
    const status = (searchParams.get('status') as DirectoryFilters['status']) || 'active';
    const rawType = searchParams.get('type');
    const type: DirectoryFilters['type'] =
      rawType === 'users'
        ? 'user'
        : rawType === 'contacts'
          ? 'contact'
          : (rawType as DirectoryFilters['type']) || 'all';

    const filters: DirectoryFilters = {
      search: searchParams.get('search') || undefined,
      type: entity === 'people' ? type : undefined,
      status,
      companyId: searchParams.get('company_id') || undefined,
      permissionTemplateId: searchParams.get('permission_template_id') || undefined,
      role: searchParams.get('role') || undefined,
      groupBy: (searchParams.get('group_by') as DirectoryFilters['groupBy']) || 'company',
      sortBy: searchParams.get('sort')?.split(',').filter(Boolean),
      page: parseNumber(searchParams.get('page'), 1),
      perPage: parseNumber(searchParams.get('per_page'), 50)
    };

    const directoryService = new DirectoryService(supabase);
    const visibility = await getVisibilityContext(supabase, projectId, user.id);
    const filterOptions = await directoryService.getDirectoryFilterOptions(projectId, visibility);

    if (entity === 'companies') {
      const result = await directoryService.getCompanyDirectory(projectId, filters);

      return NextResponse.json({
        data: result.data,
        meta: result.meta,
        filters: filterOptions,
        permissions
      });
    }

    if (!visibility.isInternalUser && visibility.companyId) {
      filters.companyId = visibility.companyId;
      if (filters.status === 'inactive') {
        filters.status = 'active';
      }
    }

    const result = await directoryService.getPeople(
      projectId,
      filters,
      visibility,
      filterOptions.companies
    );

    return NextResponse.json({
      ...result,
      filters: filterOptions,
      permissions
    });
  } catch (error) {
    console.error('Error fetching directory:', error);
    return NextResponse.json(
      { error: 'Internal server error', permissions: EMPTY_PERMISSIONS },
      { status: 500 }
    );
  }
}
