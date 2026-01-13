"use client";

import { useCallback, useEffect, useState } from "react";
import { RagChatKitPanel } from "@/components/chat/rag-chatkit-panel";
import { SimpleRagChat } from "@/components/chat/simple-rag-chat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type RagStatePayload = {
  thread_id?: string | null;
  current_agent?: string;
  context?: {
    backend_status?: string;
    notice?: string;
    [key: string]: unknown;
  };
};

type RagStateResult<T = RagStatePayload> = {
  data: T | null;
  offline: boolean;
};

async function fetchRagBootstrapState(): Promise<RagStateResult> {
  try {
    const res = await fetch("/api/rag-chatkit/bootstrap");
    const offline = res.headers.get("x-rag-backend-status") === "offline";
    if (!res.ok) {
      return { data: null, offline };
    }
    const data = (await res.json()) as RagStatePayload;
    return { data, offline };
  } catch {
    return { data: null, offline: true };
  }
}

async function fetchRagThreadState(threadId: string): Promise<RagStateResult> {
  try {
    const res = await fetch(`/api/rag-chatkit/state?thread_id=${threadId}`);
    const offline = res.headers.get("x-rag-backend-status") === "offline";
    if (!res.ok) {
      return { data: null, offline };
    }
    const data = (await res.json()) as RagStatePayload;
    return { data, offline };
  } catch {
    return { data: null, offline: true };
  }
}

export default function RagHome() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [initialThreadId, setInitialThreadId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [bootstrapReady, setBootstrapReady] = useState(false);

  const hydrateState = useCallback(
    async (id: string | null) => {
      if (!id || isOffline) return;
      const { data, offline } = await fetchRagThreadState(id);
      if (offline) {
        setIsOffline(true);
        setOfflineMessage(
          data?.context?.notice ||
            "The realtime AI backend is offline. Showing demo mode instead.",
        );
        return;
      }
      if (!data) return;
    },
    [isOffline],
  );

  useEffect(() => {
    if (threadId && !isOffline) {
      void hydrateState(threadId);
    }
  }, [threadId, hydrateState, isOffline]);

  useEffect(() => {
    (async () => {
      const { data: bootstrap, offline } = await fetchRagBootstrapState();
      if (
        !bootstrap ||
        offline ||
        bootstrap?.context?.backend_status === "offline"
      ) {
        setIsOffline(true);
        setOfflineMessage(
          bootstrap?.context?.notice ||
            "The Alleato AI backend is currently offline. You can continue in demo mode below.",
        );
        setBootstrapReady(true);
        return;
      }

      setInitialThreadId(bootstrap.thread_id || null);
      setThreadId(bootstrap.thread_id || null);
      setBootstrapReady(true);
    })();
  }, []);

  const handleThreadChange = useCallback((id: string | null) => {
    setThreadId(id);
  }, []);

  const handleResponseEnd = useCallback(() => {
    if (!isOffline) {
      void hydrateState(threadId);
    }
  }, [hydrateState, threadId, isOffline]);

  if (isOffline) {
    return (
      <div
        className="flex w-full -mx-4 sm:-mx-6 lg:-mx-8 -my-6"
        style={{ height: "calc(100vh - 64px)" }}
      >
        <div className="flex flex-col flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 gap-4">
          <Alert>
            <AlertTitle>Alleato AI backend unavailable</AlertTitle>
            <AlertDescription>
              {offlineMessage ||
                "Real-time ChatKit responses are paused while the backend restarts. Use the simplified RAG chat to continue exploring."}
            </AlertDescription>
          </Alert>
          <div className="flex-1 overflow-hidden rounded-xl border bg-background">
            <SimpleRagChat placeholder="Demo mode – ask about any project update" />
          </div>
        </div>
      </div>
    );
  }

  if (!bootstrapReady) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-64px)] text-sm text-muted-foreground">
        Connecting to Alleato AI…
      </div>
    );
  }

  return (
    <div
      className="flex w-full -mx-4 sm:-mx-6 lg:-mx-8 -my-6"
      style={{ height: "calc(100vh - 64px)" }}
    >
      <RagChatKitPanel
        initialThreadId={initialThreadId}
        onThreadChange={handleThreadChange}
        onResponseEnd={handleResponseEnd}
      />
    </div>
  );
}
