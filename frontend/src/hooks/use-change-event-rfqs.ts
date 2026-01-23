"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ChangeEventRfq,
  ChangeEventRfqResponse,
} from "@/types/change-events";

export interface ChangeEventRfqRecord extends ChangeEventRfq {
  change_event_number: string | null;
  change_event_title: string | null;
  response_count: number;
}

interface UseRfqOptions {
  enabled?: boolean;
}

export interface CreateRfqInput {
  changeEventId: string;
  title?: string;
  dueDate?: string;
  includeAttachments?: boolean;
  notes?: string;
}

export interface CreateRfqResponseInput {
  rfqId: string;
  changeEventId: string;
  lineItemId: string;
  unitPrice: number;
  notes?: string;
}

interface UseRfqReturn {
  rfqs: ChangeEventRfqRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createRfq: (payload: CreateRfqInput) => Promise<ChangeEventRfqRecord | null>;
  createResponse: (
    rfqId: string,
    payload: Omit<CreateRfqResponseInput, "rfqId">,
  ) => Promise<ChangeEventRfqResponse | null>;
}

export function useProjectChangeEventRfqs(
  projectId: number,
  options: UseRfqOptions = {},
): UseRfqReturn {
  const { enabled = true } = options;
  const [rfqs, setRfqs] = useState<ChangeEventRfqRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRfqs = useCallback(async () => {
    if (!projectId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/change-events/rfqs`,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to load RFQs");
      }
      const payload = await response.json();
      setRfqs(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load RFQs"));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  const createRfq = useCallback(
    async (payload: CreateRfqInput) => {
      const response = await fetch(
        `/api/projects/${projectId}/change-events/rfqs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Failed to create RFQ");
      }

      const body = await response.json();
      const record = body.data as ChangeEventRfqRecord;
      setRfqs((previous) => [record, ...previous]);
      return record;
    },
    [projectId],
  );

  const createResponse = useCallback(
    async (
      rfqId: string,
      payload: Omit<CreateRfqResponseInput, "rfqId">,
    ) => {
      const response = await fetch(
        `/api/projects/${projectId}/change-events/rfqs/${rfqId}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Failed to submit response");
      }

      const body = await response.json();
      await fetchRfqs();
      return body.data as ChangeEventRfqResponse;
    },
    [projectId, fetchRfqs],
  );

  return useMemo(
    () => ({
      rfqs,
      isLoading,
      error,
      refetch: fetchRfqs,
      createRfq,
      createResponse,
    }),
    [rfqs, isLoading, error, fetchRfqs, createRfq, createResponse],
  );
}

