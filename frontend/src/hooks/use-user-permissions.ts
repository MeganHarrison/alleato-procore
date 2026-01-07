'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Permission {
  tool_name: string;
  permission_type: string;
  is_granted: boolean;
}

interface UserPermissionsResponse {
  user_id: string;
  permissions: Permission[];
  template_permissions: Record<string, string[]>;
  effective_permissions: Record<string, string[]>;
}

export function useUserPermissions(projectId: string, personId: string) {
  return useQuery<UserPermissionsResponse>({
    queryKey: ['user-permissions', projectId, personId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/directory/people/${personId}/permissions`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user permissions');
      }

      return response.json();
    },
    enabled: !!projectId && !!personId
  });
}

export function useUpdateUserPermissions(projectId: string, personId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissions: Permission[]) => {
      const response = await fetch(
        `/api/projects/${projectId}/directory/people/${personId}/permissions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update permissions');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', projectId, personId] });
      queryClient.invalidateQueries({ queryKey: ['person', projectId, personId] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    }
  });
}
