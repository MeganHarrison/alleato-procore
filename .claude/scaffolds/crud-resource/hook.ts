// =============================================================================
// SCAFFOLD: Project-Scoped CRUD Hook
// Replace: __ENTITY__, __entity__, __entities__, __ENTITY_TABLE__
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

// Extract type from database schema
type __ENTITY__ = Database["public"]["Tables"]["__ENTITY_TABLE__"]["Row"];

// Option type for dropdowns/selects
export interface __ENTITY__Option {
  value: string;
  label: string;
  data?: __ENTITY__; // Full entity data if needed
}

// Hook options
interface Use__ENTITY__sOptions {
  projectId: number | string;
  search?: string;
  status?: "active" | "inactive" | "all";
  limit?: number;
  enabled?: boolean;
}

// Hook return type
interface Use__ENTITY__sReturn {
  __entities__: __ENTITY__[];
  options: __ENTITY__Option[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Partial<__ENTITY__>) => Promise<__ENTITY__ | null>;
  update: (id: string, data: Partial<__ENTITY__>) => Promise<__ENTITY__ | null>;
  remove: (id: string) => Promise<boolean>;
}

/**
 * Hook for fetching and managing __entities__ for a project
 */
export function use__ENTITY__s(
  options: Use__ENTITY__sOptions
): Use__ENTITY__sReturn {
  const {
    projectId,
    search,
    status = "active",
    limit = 100,
    enabled = true,
  } = options;

  const [__entities__, set__ENTITY__s] = useState<__ENTITY__[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Convert projectId to number if string
  const projectIdNum = typeof projectId === "string"
    ? parseInt(projectId, 10)
    : projectId;

  // Fetch __entities__
  const fetch__ENTITY__s = useCallback(async () => {
    if (!enabled || !projectIdNum) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = supabase
        .from("__ENTITY_TABLE__")
        .select("*")
        .eq("project_id", projectIdNum)
        .order("created_at", { ascending: false })
        .limit(limit);

      // Apply status filter
      if (status !== "all") {
        query = query.eq("status", status);
      }

      // Apply search
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      set__ENTITY__s(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch __entities__")
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectIdNum, search, status, limit, enabled]);

  // Initial fetch
  useEffect(() => {
    fetch__ENTITY__s();
  }, [fetch__ENTITY__s]);

  // Create __entity__
  const create = useCallback(
    async (data: Partial<__ENTITY__>): Promise<__ENTITY__ | null> => {
      try {
        const supabase = createClient();

        const { data: created, error: insertError } = await supabase
          .from("__ENTITY_TABLE__")
          .insert({
            project_id: projectIdNum,
            name: data.name || "",
            description: data.description,
            status: "active",
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        // Refetch to update list
        await fetch__ENTITY__s();
        return created;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create __entity__")
        );
        return null;
      }
    },
    [projectIdNum, fetch__ENTITY__s]
  );

  // Update __entity__
  const update = useCallback(
    async (id: string, data: Partial<__ENTITY__>): Promise<__ENTITY__ | null> => {
      try {
        const supabase = createClient();

        const { data: updated, error: updateError } = await supabase
          .from("__ENTITY_TABLE__")
          .update(data)
          .eq("id", id)
          .eq("project_id", projectIdNum)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Refetch to update list
        await fetch__ENTITY__s();
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to update __entity__")
        );
        return null;
      }
    },
    [projectIdNum, fetch__ENTITY__s]
  );

  // Delete __entity__
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const supabase = createClient();

        // Soft delete by setting status
        const { error: deleteError } = await supabase
          .from("__ENTITY_TABLE__")
          .update({ status: "deleted" })
          .eq("id", id)
          .eq("project_id", projectIdNum);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // Refetch to update list
        await fetch__ENTITY__s();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to delete __entity__")
        );
        return false;
      }
    },
    [projectIdNum, fetch__ENTITY__s]
  );

  // Transform to dropdown options
  const __entity__Options: __ENTITY__Option[] = __entities__.map((item) => ({
    value: item.id,
    label: item.name,
    data: item,
  }));

  return {
    __entities__,
    options: __entity__Options,
    isLoading,
    error,
    refetch: fetch__ENTITY__s,
    create,
    update,
    remove,
  };
}
