import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import type {
  CompanyDirectoryResponse,
  DirectoryFilterOptions,
  DirectoryFilters,
  DirectoryGroup,
  DirectoryResponse,
  PersonWithDetails,
  ProjectDirectoryCompany
} from '@/types/directory';

type Tables = Database['public']['Tables'];
type PermissionTemplate = Tables['permission_templates']['Row'];
type Company = Tables['companies']['Row'];
type ProjectDirectoryRow = Tables['project_directory']['Row'];

interface RequesterVisibility {
  isInternalUser: boolean;
  companyId?: string;
}

export interface PersonCreateDTO {
  first_name: string;
  last_name: string;
  email?: string;
  phone_mobile?: string;
  phone_business?: string;
  job_title?: string;
  company_id?: string;
  person_type: 'user' | 'contact';
  permission_template_id?: string;
}

export interface PersonUpdateDTO extends Partial<PersonCreateDTO> {
  status?: 'active' | 'inactive';
}

export class DirectoryService {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async getPeople(
    projectId: string,
    filters: DirectoryFilters,
    visibility?: RequesterVisibility,
    groupCompanies?: Company[]
  ): Promise<DirectoryResponse> {
    const {
      search,
      type = 'all',
      status = 'active',
      companyId,
      role,
      permissionTemplateId,
      groupBy = 'none',
      sortBy = ['company.name:asc', 'last_name:asc', 'first_name:asc'],
      page = 1,
      perPage = 50
    } = filters;

    const projectIdNum = Number.parseInt(projectId, 10);
    const effectiveStatus = status === 'all' ? undefined : status;
    const effectiveCompanyId = visibility?.isInternalUser === false && visibility.companyId
      ? visibility.companyId
      : companyId;

    // Base query
    let query = this.supabase
      .from('people')
      .select(`
        *,
        company:companies(*),
        project_directory_memberships!inner(
          *,
          permission_template:permission_templates(*)
        )
      `, { count: 'exact' })
      .eq('project_directory_memberships.project_id', projectIdNum);

    // Apply filters
    if (type !== 'all') {
      query = query.eq('person_type', type);
    }

    if (effectiveStatus) {
      query = query.eq('project_directory_memberships.status', effectiveStatus);
    }

    if (effectiveCompanyId) {
      query = query.eq('company_id', effectiveCompanyId);
    }

    if (role) {
      query = query.eq('project_directory_memberships.role', role);
    }

    if (permissionTemplateId) {
      query = query.eq('project_directory_memberships.permission_template_id', permissionTemplateId);
    }

    // Apply search
    if (search) {
      query = query.or(`
        first_name.ilike.%${search}%,
        last_name.ilike.%${search}%,
        email.ilike.%${search}%,
        phone_mobile.ilike.%${search}%,
        phone_business.ilike.%${search}%
      `);
    }

    // Apply sorting (excluding nested relations which can't be sorted directly)
    for (const sort of sortBy) {
      const [field, direction = 'asc'] = sort.split(':');
      // Skip nested fields like 'company.name' - sort these client-side instead
      if (!field.includes('.')) {
        query = query.order(field, { ascending: direction === 'asc' });
      }
    }

    // Apply pagination
    const offset = (page - 1) * perPage;
    query = query.range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data
    const transformedData: PersonWithDetails[] = (data || []).map(person => ({
      ...person,
      membership: person.project_directory_memberships?.[0],
      permission_template: person.project_directory_memberships?.[0]?.permission_template
    }));

    // Apply client-side sorting for nested fields
    const nestedSorts = sortBy.filter(s => s.includes('.'));
    if (nestedSorts.length > 0) {
      transformedData.sort((a, b) => {
        for (const sort of nestedSorts) {
          const [field, direction = 'asc'] = sort.split(':');
          const asc = direction === 'asc' ? 1 : -1;

          // Handle company.name sorting
          if (field === 'company.name') {
            const aName = a.company?.name || '';
            const bName = b.company?.name || '';
            const cmp = aName.localeCompare(bName);
            if (cmp !== 0) return cmp * asc;
          }
        }
        return 0;
      });
    }

    // Group if needed
    let groups: DirectoryGroup[] | undefined;
    if (groupBy === 'company') {
      const groupMap = new Map<string, PersonWithDetails[]>();
      const labelMap = new Map<string, string>();

      groupCompanies?.forEach(company => {
        if (company.id) {
          groupMap.set(company.id, []);
          labelMap.set(company.id, company.name);
        }
      });
      
      transformedData.forEach(person => {
        const companyId = person.company?.id || 'no-company';
        const companyName = person.company?.name || 'No Company';
        
        if (!groupMap.has(companyId)) {
          groupMap.set(companyId, []);
          labelMap.set(companyId, companyName);
        }
        groupMap.get(companyId)!.push(person);
        if (!labelMap.has(companyId)) {
          labelMap.set(companyId, companyName);
        }
      });

      groups = Array.from(groupMap.entries()).map(([key, items]) => ({
        key,
        label: labelMap.get(key) || 'No Company',
        items
      })).sort((a, b) => a.label.localeCompare(b.label));
    }

    return {
      data: transformedData,
      groups,
      meta: {
        total: count || 0,
        page,
        perPage,
        totalPages: Math.ceil((count || 0) / perPage)
      }
    };
  }

  async getDirectoryFilterOptions(
    projectId: string,
    visibility?: RequesterVisibility
  ): Promise<DirectoryFilterOptions> {
    const projectIdNum = Number.parseInt(projectId, 10);

    const { data: directoryCompanies, error: directoryError } = await this.supabase
      .from('project_directory')
      .select('company:companies(*)')
      .eq('project_id', projectIdNum)
      .eq('is_active', true);

    if (directoryError) throw directoryError;

    const companies = (directoryCompanies || [])
      .map(entry => entry.company)
      .filter((company): company is Company => Boolean(company))
      .filter(company => {
        if (visibility?.isInternalUser === false && visibility.companyId) {
          return company.id === visibility.companyId;
        }
        return true;
      });

    const { data: templates, error: templateError } = await this.supabase
      .from('permission_templates')
      .select('*')
      .eq('scope', 'project')
      .order('name');

    if (templateError) throw templateError;

    const { data: rolesData, error: rolesError } = await this.supabase
      .from('project_directory_memberships')
      .select('role')
      .eq('project_id', projectIdNum)
      .not('role', 'is', null);

    if (rolesError) throw rolesError;

    const { data: directoryRoles, error: directoryRolesError } = await this.supabase
      .from('project_directory')
      .select('role')
      .eq('project_id', projectIdNum)
      .not('role', 'is', null);

    if (directoryRolesError) throw directoryRolesError;

    const roles = Array.from(
      new Set(
        [
          ...(rolesData || []),
          ...(directoryRoles || [])
        ]
          .map(roleRow => roleRow.role)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    return {
      companies,
      permissionTemplates: templates || [],
      roles
    };
  }

  async getCompanyDirectory(projectId: string, filters: DirectoryFilters): Promise<CompanyDirectoryResponse> {
    const {
      search,
      status = 'active',
      sortBy = ['company.name:asc'],
      page = 1,
      perPage = 50
    } = filters;

    const projectIdNum = Number.parseInt(projectId, 10);

    let query = this.supabase
      .from('project_directory')
      .select(`
        *,
        company:companies(*)
      `, { count: 'exact' })
      .eq('project_id', projectIdNum);

    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (search) {
      query = query.or(`
        company.name.ilike.%${search}%,
        company.city.ilike.%${search}%,
        company.state.ilike.%${search}%
      `);
    }

    for (const sort of sortBy) {
      const [field, direction = 'asc'] = sort.split(':');
      if (!field.includes('.')) {
        query = query.order(field, { ascending: direction === 'asc' });
      }
    }

    const offset = (page - 1) * perPage;
    query = query.range(offset, offset + perPage - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const transformedData: ProjectDirectoryCompany[] = (data || []).map(entry => ({
      ...entry,
      company: (entry as unknown as { company?: Company }).company ?? null
    }));

    const nestedSorts = sortBy.filter(s => s.includes('.'));
    if (nestedSorts.length > 0) {
      transformedData.sort((a, b) => {
        for (const sort of nestedSorts) {
          const [field, direction = 'asc'] = sort.split(':');
          const asc = direction === 'asc' ? 1 : -1;

          if (field === 'company.name') {
            const aName = a.company?.name || '';
            const bName = b.company?.name || '';
            const cmp = aName.localeCompare(bName);
            if (cmp !== 0) return cmp * asc;
          }
        }
        return 0;
      });
    }

    return {
      data: transformedData,
      meta: {
        total: count || 0,
        page,
        perPage,
        totalPages: Math.ceil((count || 0) / perPage)
      }
    };
  }

  async createPerson(projectId: string, data: PersonCreateDTO): Promise<PersonWithDetails> {
    // Start a transaction
    const { data: person, error: personError } = await this.supabase
      .from('people')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_mobile: data.phone_mobile,
        phone_business: data.phone_business,
        job_title: data.job_title,
        company_id: data.company_id,
        person_type: data.person_type
      })
      .select()
      .single();

    if (personError) throw personError;

    // Create membership
    const { data: membership, error: membershipError } = await this.supabase
      .from('project_directory_memberships')
      .insert({
        project_id: parseInt(projectId),
        person_id: person.id,
        permission_template_id: data.permission_template_id,
        invite_status: data.person_type === 'user' ? 'not_invited' : 'accepted'
      })
      .select('*, permission_template:permission_templates(*)')
      .single();

    if (membershipError) throw membershipError;

    // Fetch company if exists
    let company;
    if (person.company_id) {
      const { data: companyData } = await this.supabase
        .from('companies')
        .select()
        .eq('id', person.company_id)
        .single();
      company = companyData;
    }

    return {
      ...person,
      company,
      membership,
      permission_template: membership.permission_template
    };
  }

  async updatePerson(projectId: string, personId: string, data: PersonUpdateDTO): Promise<PersonWithDetails> {
    const projectIdNum = Number.parseInt(projectId, 10);
    // Update person fields
    const personUpdate: Record<string, unknown> = {};
    const personFields: Array<keyof PersonUpdateDTO> = ['first_name', 'last_name', 'email', 'phone_mobile', 'phone_business', 'job_title', 'company_id'];
    
    for (const field of personFields) {
      if (data[field] !== undefined) {
        personUpdate[field] = data[field];
      }
    }

    if (Object.keys(personUpdate).length > 0) {
      const { error } = await this.supabase
        .from('people')
        .update(personUpdate)
        .eq('id', personId);
      
      if (error) throw error;
    }

    // Update membership fields
    const membershipUpdate: Record<string, unknown> = {};
    if (data.permission_template_id !== undefined) {
      membershipUpdate.permission_template_id = data.permission_template_id;
    }
    if (data.status !== undefined) {
      membershipUpdate.status = data.status;
    }

    if (Object.keys(membershipUpdate).length > 0) {
      const { error } = await this.supabase
        .from('project_directory_memberships')
        .update(membershipUpdate)
        .eq('project_id', projectIdNum)
        .eq('person_id', personId);
      
      if (error) throw error;
    }

    // Return updated person
    return this.getPerson(projectId, personId);
  }

  async getPerson(projectId: string, personId: string): Promise<PersonWithDetails> {
    const projectIdNum = Number.parseInt(projectId, 10);

    const { data, error} = await this.supabase
      .from('people')
      .select(`
        *,
        company:companies(*),
        project_directory_memberships!inner(
          *,
          permission_template:permission_templates(*)
        )
      `)
      .eq('id', personId)
      .eq('project_directory_memberships.project_id', projectIdNum)
      .single();

    if (error) throw error;

    return {
      ...data,
      membership: data.project_directory_memberships?.[0],
      permission_template: data.project_directory_memberships?.[0]?.permission_template
    };
  }

  async deactivatePerson(projectId: string, personId: string): Promise<void> {
    const projectIdNum = Number.parseInt(projectId, 10);

    const { error } = await this.supabase
      .from('project_directory_memberships')
      .update({ status: 'inactive' })
      .eq('project_id', projectIdNum)
      .eq('person_id', personId);

    if (error) throw error;
  }

  async reactivatePerson(projectId: string, personId: string): Promise<void> {
    const projectIdNum = Number.parseInt(projectId, 10);

    const { error } = await this.supabase
      .from('project_directory_memberships')
      .update({ status: 'active' })
      .eq('project_id', projectIdNum)
      .eq('person_id', personId);

    if (error) throw error;
  }

  async updateCompanyEntry(
    projectId: string,
    entryId: string,
    updates: Partial<ProjectDirectoryRow>
  ): Promise<ProjectDirectoryCompany> {
    const projectIdNum = Number.parseInt(projectId, 10);

    const { data, error } = await this.supabase
      .from('project_directory')
      .update(updates)
      .eq('project_id', projectIdNum)
      .eq('id', entryId)
      .select('*, company:companies(*)')
      .single();

    if (error) throw error;
    return { ...data, company: (data as unknown as { company?: Company }).company ?? null };
  }

  async deleteCompanyEntry(projectId: string, entryId: string): Promise<void> {
    const projectIdNum = Number.parseInt(projectId, 10);

    const { error } = await this.supabase
      .from('project_directory')
      .delete()
      .eq('project_id', projectIdNum)
      .eq('id', entryId);

    if (error) throw error;
  }

  async getAllCompanies(_projectId: string): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getPermissionTemplates(): Promise<PermissionTemplate[]> {
    const { data, error } = await this.supabase
      .from('permission_templates')
      .select('*')
      .eq('scope', 'project')
      .order('name');

    if (error) throw error;
    return data || [];
  }
}
