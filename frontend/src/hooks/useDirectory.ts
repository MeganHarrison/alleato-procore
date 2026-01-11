"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import type {
  DirectoryFilters,
  PersonWithDetails,
} from "@/components/directory/DirectoryFilters";

interface DirectoryGroup {
  key: string;
  label: string;
  items: PersonWithDetails[];
}

interface UseDirectoryResult {
  data: PersonWithDetails[];
  groups?: DirectoryGroup[];
  loading: boolean;
  error: Error | null;
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  refetch: () => void;
  updateFilters: (filters: DirectoryFilters) => void;
}

/**
 * React hook that fetches and exposes a project's directory of people with support for filtering, grouping, and pagination metadata.
 *
 * @param projectId - The ID of the project whose directory will be fetched
 * @param initialFilters - Optional initial filters applied to the directory query
 * @returns An object with:
 *  - `data`: array of `PersonWithDetails` for the current query
 *  - `groups`: optional grouped representation of `data`
 *  - `loading`: boolean indicating an in-flight fetch
 *  - `error`: an `Error` instance if the last fetch failed, or `null`
 *  - `meta`: pagination metadata (`total`, `page`, `perPage`, `totalPages`)
 *  - `refetch`: function to re-run the current fetch
 *  - `updateFilters`: function to replace the current filters
 */
export function useDirectory(
  projectId: string,
  initialFilters: DirectoryFilters = {},
): UseDirectoryResult {
  const supabase = useSupabase();
  const [data, setData] = useState<PersonWithDetails[]>([]);
  const [groups, setGroups] = useState<DirectoryGroup[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DirectoryFilters>(initialFilters);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    perPage: 50,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.companyId) params.append("company_id", filters.companyId);
      if (filters.permissionTemplateId)
        params.append("permission_template_id", filters.permissionTemplateId);
      if (filters.groupBy) params.append("group_by", filters.groupBy);
      if (filters.sortBy?.length)
        params.append("sort", filters.sortBy.join(","));
      params.append("page", "1");
      params.append("per_page", "50");

      // Fetch from API
      const response = await fetch(
        `/api/projects/${projectId}/directory/people?${params}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch directory: ${response.statusText}`);
      }

      const result = await response.json();

      setData(result.data || []);
      setGroups(result.groups);
      setMeta(
        result.meta || {
          total: 0,
          page: 1,
          perPage: 50,
          totalPages: 0,
        },
      );
    } catch (err) {
      console.error("Error fetching directory:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [projectId, filters, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = useCallback((newFilters: DirectoryFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    data,
    groups,
    loading,
    error,
    meta,
    refetch: fetchData,
    updateFilters,
  };
}
