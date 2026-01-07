import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProjectCompany, CompanyListResponse, CompanyCreateDTO, CompanyUpdateDTO, CompanyFilters } from '@/services/companyService';

interface UseProjectCompaniesResult {
  companies: ProjectCompany[];
  pagination: CompanyListResponse['pagination'] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProjectCompanies(
  projectId: string,
  filters: CompanyFilters = {}
): UseProjectCompaniesResult {
  const query = useQuery<CompanyListResponse, Error>({
    queryKey: ['project-companies', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.company_type) params.set('company_type', filters.company_type);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.per_page) params.set('per_page', String(filters.per_page));

      const response = await fetch(`/api/projects/${projectId}/directory/companies?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch companies');
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  return {
    companies: query.data?.data || [],
    pagination: query.data?.pagination || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

interface UseProjectCompanyResult {
  company: ProjectCompany | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProjectCompany(
  projectId: string,
  companyId: string | null
): UseProjectCompanyResult {
  const query = useQuery<ProjectCompany, Error>({
    queryKey: ['project-company', projectId, companyId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/directory/companies/${companyId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch company');
      }
      return response.json();
    },
    enabled: !!projectId && !!companyId,
  });

  return {
    company: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateProjectCompany(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompanyCreateDTO) => {
      const response = await fetch(`/api/projects/${projectId}/directory/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create company');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-companies', projectId] });
    },
  });
}

export function useUpdateProjectCompany(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: CompanyUpdateDTO }) => {
      const response = await fetch(`/api/projects/${projectId}/directory/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update company');
      }
      return response.json();
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-companies', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-company', projectId, companyId] });
    },
  });
}

export function useDeleteProjectCompany(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch(`/api/projects/${projectId}/directory/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete company');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-companies', projectId] });
    },
  });
}
