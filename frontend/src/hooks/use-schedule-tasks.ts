"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  ScheduleTaskWithHierarchy,
  ScheduleSummary,
  GanttChartItem,
} from "@/types/scheduling";

export interface SchedulePageData {
  tasks: ScheduleTaskWithHierarchy[];
  summary: ScheduleSummary;
  ganttData: GanttChartItem[];
}

interface UseScheduleTasksOptions {
  projectId: string;
  enabled?: boolean;
}

interface UseScheduleTasksReturn {
  data: SchedulePageData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const defaultSummary: ScheduleSummary = {
  total_tasks: 0,
  completed_tasks: 0,
  in_progress_tasks: 0,
  not_started_tasks: 0,
  milestones_count: 0,
  overdue_tasks: 0,
  overall_percent_complete: 0,
};

/**
 * Hook for fetching schedule tasks data from API
 * Follows the same pattern as use-companies.ts and use-commitments.ts
 */
export function useScheduleTasks(
  options: UseScheduleTasksOptions
): UseScheduleTasksReturn {
  const { projectId, enabled = true } = options;
  const [data, setData] = useState<SchedulePageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchScheduleData = useCallback(async () => {
    if (!enabled || !projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `/api/projects/${projectId}/scheduling/tasks`;

      // Fetch all data in parallel (same as original fetcher pattern)
      const [hierarchyRes, summaryRes, ganttRes] = await Promise.all([
        fetch(`${apiUrl}?view=hierarchy`, { credentials: "include" }),
        fetch(`${apiUrl}?view=summary`, { credentials: "include" }),
        fetch(`${apiUrl}?view=gantt`, { credentials: "include" }),
      ]);

      // Check for errors
      if (!hierarchyRes.ok || !summaryRes.ok || !ganttRes.ok) {
        const status = !hierarchyRes.ok
          ? hierarchyRes.status
          : !summaryRes.ok
            ? summaryRes.status
            : ganttRes.status;
        throw new Error(`Failed to fetch schedule data (status: ${status})`);
      }

      // Parse responses
      const [hierarchyData, summaryData, ganttData] = await Promise.all([
        hierarchyRes.json(),
        summaryRes.json(),
        ganttRes.json(),
      ]);

      setData({
        tasks: hierarchyData.data || [],
        summary: summaryData.data || defaultSummary,
        ganttData: ganttData.data || [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch schedule data")
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchScheduleData,
  };
}
