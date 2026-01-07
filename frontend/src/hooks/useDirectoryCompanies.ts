"use client";

import { useCallback, useEffect, useState } from 'react';
import type {
  DirectoryFilterOptions,
  DirectoryFilters,
  DirectoryPermissions,
  ProjectDirectoryCompany
} from '@/types/directory';

interface UseDirectoryCompaniesResult {
  data: ProjectDirectoryCompany[];
  loading: boolean;
  error: Error | null;
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  filterOptions: DirectoryFilterOptions;
  permissions: DirectoryPermissions;
  refetch: () => void;
  updateFilters: (filters: DirectoryFilters) => void;
}

const defaultPermissions: DirectoryPermissions = {
  canRead: false,
  canInvite: false,
  canEdit: false,
  canRemove: false
};

export function useDirectoryCompanies(
  projectId: string,
  initialFilters: DirectoryFilters = {}
): UseDirectoryCompaniesResult {
  const [data, setData] = useState<ProjectDirectoryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DirectoryFilters>(initialFilters);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    perPage: 50,
    totalPages: 0
  });
  const [filterOptions, setFilterOptions] = useState<DirectoryFilterOptions>({
    companies: [],
    permissionTemplates: [],
    roles: []
  });
  const [permissions, setPermissions] = useState<DirectoryPermissions>(defaultPermissions);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('entity', 'companies');
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.companyId) params.append('company_id', filters.companyId);
      if (filters.sortBy?.length) params.append('sort', filters.sortBy.join(','));
      params.append('page', (filters.page ?? 1).toString());
      params.append('per_page', (filters.perPage ?? 50).toString());

      const response = await fetch(`/api/projects/${projectId}/directory?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
      }

      const result = await response.json();

      setData(result.data || []);
      setMeta(result.meta || {
        total: 0,
        page: 1,
        perPage: 50,
        totalPages: 0
      });
      setFilterOptions(result.filters || { companies: [], permissionTemplates: [], roles: [] });
      setPermissions(result.permissions || defaultPermissions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters: DirectoryFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    data,
    loading,
    error,
    meta,
    filterOptions,
    permissions,
    refetch: fetchData,
    updateFilters
  };
}
