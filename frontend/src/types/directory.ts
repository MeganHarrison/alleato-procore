import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Company = Tables['companies']['Row'];
type PermissionTemplate = Tables['permission_templates']['Row'];
type ProjectDirectoryMembership = Tables['project_directory_memberships']['Row'];
type Person = Tables['people']['Row'];
type ProjectDirectoryRow = Tables['project_directory']['Row'];

export interface DirectoryFilters {
  search?: string;
  type?: 'user' | 'contact' | 'all';
  status?: 'active' | 'inactive' | 'all';
  companyId?: string;
  role?: string;
  permissionTemplateId?: string;
  groupBy?: 'company' | 'none';
  sortBy?: string[];
  page?: number;
  perPage?: number;
}

export interface DirectoryPermissions {
  canRead: boolean;
  canInvite: boolean;
  canEdit: boolean;
  canRemove: boolean;
}

export interface DirectoryMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PersonWithDetails extends Person {
  company?: Company | null;
  membership?: ProjectDirectoryMembership | null;
  permission_template?: PermissionTemplate | null;
}

export interface ProjectDirectoryCompany extends ProjectDirectoryRow {
  company?: Company | null;
}

export interface DirectoryGroup<T = PersonWithDetails> {
  key: string;
  label: string;
  items: T[];
}

export interface DirectoryFilterOptions {
  companies: Company[];
  permissionTemplates: PermissionTemplate[];
  roles: string[];
}

export interface DirectoryResponse {
  data: PersonWithDetails[];
  groups?: DirectoryGroup[];
  meta: DirectoryMeta;
}

export interface CompanyDirectoryResponse {
  data: ProjectDirectoryCompany[];
  meta: DirectoryMeta;
}
