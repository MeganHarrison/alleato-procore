"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function usePermissionTemplates(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["permission-templates", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permission_templates")
        .select("*")
        .eq("project_id", parseInt(projectId, 10))
        .order("name");

      if (error) {
        throw new Error(error.message);
      }

      return data as PermissionTemplate[];
    },
    enabled: !!projectId,
  });
}
