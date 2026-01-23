"use client";

import * as React from "react";
import { useSupabase } from "./useSupabase";

type ChangeEventType = "INSERT" | "UPDATE" | "DELETE";

export function useDirectoryRealtime(
  projectId: string | undefined,
  onChange: (event: ChangeEventType, payload: Record<string, unknown>) => void,
) {
  const supabase = useSupabase();

  React.useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`directory-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_directory_memberships",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          onChange(
            payload.eventType as ChangeEventType,
            (payload.new || payload.old) as Record<string, unknown>,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, supabase, onChange]);
}
