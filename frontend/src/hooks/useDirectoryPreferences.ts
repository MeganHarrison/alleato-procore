"use client";

import * as React from "react";
import type { DirectoryFilters } from "@/components/directory/DirectoryFilters";
import type { ColumnConfig } from "@/components/directory/ColumnManager";
import type { DirectorySavedFilter } from "@/services/directoryPreferencesService";
import { toast } from "@/hooks/use-toast";

interface DirectoryPreferencesState {
  savedFilters: DirectorySavedFilter[];
  lastFilters?: DirectoryFilters;
  columnPreferences?: ColumnConfig[];
  loading: boolean;
}

export function useDirectoryPreferences(projectId: string) {
  const [state, setState] = React.useState<DirectoryPreferencesState>({
    savedFilters: [],
    loading: true,
  });

  const refresh = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const [filtersResponse, prefsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/directory/filters`),
        fetch(`/api/projects/${projectId}/directory/preferences`),
      ]);

      if (!filtersResponse.ok || !prefsResponse.ok) {
        throw new Error("Failed to load preferences");
      }

      const filtersPayload = await filtersResponse.json();
      const prefsPayload = await prefsResponse.json();

      setState({
        savedFilters: filtersPayload.data || [],
        lastFilters: prefsPayload.data?.lastFilters,
        columnPreferences: prefsPayload.data?.columnPreferences,
        loading: false,
      });
    } catch (error) {
      console.error("[DirectoryPreferences] load failed", error);
      setState((prev) => ({ ...prev, loading: false }));
      toast.error("Unable to load saved filters");
    }
  }, [projectId]);

  React.useEffect(() => {
    if (!projectId) return;
    void refresh();
  }, [projectId, refresh]);

  const saveFilter = React.useCallback(
    async (payload: {
      id?: string;
      name: string;
      description?: string;
      filters: DirectoryFilters;
      search?: string;
    }) => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/directory/filters`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          throw new Error("Unable to save filter");
        }
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          savedFilters: prev.savedFilters.some(
            (filter) => filter.id === data.data.id,
          )
            ? prev.savedFilters.map((filter) =>
                filter.id === data.data.id ? data.data : filter,
              )
            : [...prev.savedFilters, data.data],
        }));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save filter",
        );
      }
    },
    [projectId],
  );

  const deleteFilter = React.useCallback(
    async (filterId: string) => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/directory/filters?id=${filterId}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          throw new Error("Unable to delete filter");
        }
        setState((prev) => ({
          ...prev,
          savedFilters: prev.savedFilters.filter(
            (filter) => filter.id !== filterId,
          ),
        }));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete filter",
        );
      }
    },
    [projectId],
  );

  const persistPreferences = React.useCallback(
    async (payload: {
      lastFilters?: DirectoryFilters;
      columnPreferences?: ColumnConfig[];
    }) => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/directory/preferences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          throw new Error("Unable to save preferences");
        }
        setState((prev) => ({
          ...prev,
          lastFilters: payload.lastFilters ?? prev.lastFilters,
          columnPreferences: payload.columnPreferences ?? prev.columnPreferences,
        }));
      } catch (error) {
        console.error("[DirectoryPreferences] save failed", error);
      }
    },
    [projectId],
  );

  return {
    ...state,
    refresh,
    saveFilter,
    deleteFilter,
    persistPreferences,
  };
}
