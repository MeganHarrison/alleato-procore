import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];
type Person = Tables['people']['Row'];
type ProjectDirectoryMembership = Tables['project_directory_memberships']['Row'];
type PermissionTemplate = Tables['permission_templates']['Row'];
type Company = Tables['companies']['Row'];

export interface DirectoryFilters {
  search?: string;
  type?: 'user' | 'contact' | 'all';
  status?: 'active' | 'inactive' | 'all';
  companyId?: string;
  permissionTemplateId?: string;
  groupBy?: 'company' | 'none';
  sortBy?: string[];
  page?: number;
  perPage?: number;
}

export interface PersonWithDetails extends Person {
  company?: Company;
  membership?: ProjectDirectoryMembership;
  permission_template?: PermissionTemplate;
}

export interface DirectoryGroup {
  key: string;
  label: string;
  items: PersonWithDetails[];
}

export interface DirectoryResponse {
  data: PersonWithDetails[];
  groups?: DirectoryGroup[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
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

  async getPeople(projectId: string, filters: DirectoryFilters): Promise<DirectoryResponse> {
    const { 
      search, 
      type = 'all', 
      status = 'active',
      companyId,
      permissionTemplateId,
      groupBy = 'none',
      sortBy = ['company.name', 'last_name', 'first_name'],
      page = 1,
      perPage = 50
    } = filters;

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
      .eq('project_directory_memberships.project_id', projectId);

    // Apply filters
    if (type !== 'all') {
      query = query.eq('person_type', type);
    }

    if (status !== 'all') {
      query = query.eq('project_directory_memberships.status', status);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
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
        phone_business.ilike.%${search}%,
        company.name.ilike.%${search}%
      `);
    }

    // Apply sorting
    for (const sort of sortBy) {
      const [field, direction = 'asc'] = sort.split(':');
      query = query.order(field, { ascending: direction === 'asc' });
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

    // Group if needed
    let groups: DirectoryGroup[] | undefined;
    if (groupBy === 'company') {
      const groupMap = new Map<string, PersonWithDetails[]>();
      
      transformedData.forEach(person => {
        const companyId = person.company?.id || 'no-company';
        const companyName = person.company?.name || 'No Company';
        
        if (!groupMap.has(companyId)) {
          groupMap.set(companyId, []);
        }
        groupMap.get(companyId)!.push(person);
      });

      groups = Array.from(groupMap.entries()).map(([key, items]) => ({
        key,
        label: items[0]?.company?.name || 'No Company',
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
    // Update person fields
    const personUpdate: any = {};
    const personFields = ['first_name', 'last_name', 'email', 'phone_mobile', 'phone_business', 'job_title', 'company_id'];
    
    for (const field of personFields) {
      if (field in data) {
        personUpdate[field] = data[field as keyof PersonUpdateDTO];
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
    const membershipUpdate: any = {};
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
        .eq('project_id', projectId)
        .eq('person_id', personId);
      
      if (error) throw error;
    }

    // Return updated person
    return this.getPerson(projectId, personId);
  }

  async getPerson(projectId: string, personId: string): Promise<PersonWithDetails> {
    const { data, error } = await this.supabase
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
      .eq('project_directory_memberships.project_id', projectId)
      .single();

    if (error) throw error;

    return {
      ...data,
      membership: data.project_directory_memberships?.[0],
      permission_template: data.project_directory_memberships?.[0]?.permission_template
    };
  }

  async deactivatePerson(projectId: string, personId: string): Promise<void> {
    const { error } = await this.supabase
      .from('project_directory_memberships')
      .update({ status: 'inactive' })
      .eq('project_id', projectId)
      .eq('person_id', personId);

    if (error) throw error;
  }

  async reactivatePerson(projectId: string, personId: string): Promise<void> {
    const { error } = await this.supabase
      .from('project_directory_memberships')
      .update({ status: 'active' })
      .eq('project_id', projectId)
      .eq('person_id', personId);

    if (error) throw error;
  }

  async getCompanies(projectId: string): Promise<Company[]> {
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