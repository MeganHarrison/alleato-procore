import type {
  Agent,
  AgentEvent,
  GuardrailCheck,
  ChatSourceSnippet,
} from "@/lib/types";

type SerializedAgentEvent = Omit<AgentEvent, "timestamp"> & {
  timestamp: string;
};
type SerializedGuardrailCheck = Omit<GuardrailCheck, "timestamp"> & {
  timestamp: string;
};

export interface RagThreadStatePayload {
  thread_id: string;
  current_agent: string;
  context: Record<string, any>;
  agents: Agent[];
  events: SerializedAgentEvent[];
  guardrails: SerializedGuardrailCheck[];
}

export interface OfflineSimpleChatResponse {
  response: string;
  retrieved: ChatSourceSnippet[];
  thread_id: string | null;
  offline: true;
  notice: string;
  diagnostics?: Record<string, string>;
}

export function buildOfflineThreadState(
  threadId = "offline-demo-thread",
): RagThreadStatePayload {
  const timestamp = new Date().toISOString();
  const agents: Agent[] = [
    {
      name: "classification",
      description: "Classifies user questions and determines routing",
      handoffs: ["project", "internal_knowledge", "strategist"],
      tools: ["project_router"],
      input_guardrails: ["unsupported_file", "missing_context"],
    },
    {
      name: "project",
      description: "Answers project specific questions using Supabase data",
      handoffs: ["internal_knowledge"],
      tools: ["supabase", "documents"],
      input_guardrails: ["missing_project"],
    },
    {
      name: "internal_knowledge",
      description: "Searches the internal Alleato knowledge base",
      handoffs: ["strategist"],
      tools: ["vector_search"],
      input_guardrails: [],
    },
    {
      name: "strategist",
      description: "Produces executive level summaries",
      handoffs: [],
      tools: ["report_builder"],
      input_guardrails: [],
    },
  ];

  const events: SerializedAgentEvent[] = [
    {
      id: "offline-event-1",
      type: "agent_start",
      agent: "classification",
      content: "Bootstrapped demo session because the AI backend is offline.",
      timestamp,
      metadata: {
        notice: "offline-backend",
      },
    },
    {
      id: "offline-event-2",
      type: "context_update",
      agent: "project",
      content:
        "Loaded cached context so the UI can render without a live connection.",
      timestamp,
      metadata: {
        context_key: "offline_context",
        context_value: true,
      },
    },
  ];

  const guardrails: SerializedGuardrailCheck[] = [
    {
      id: "offline-guardrail-1",
      name: "Backend availability",
      input: "Python backend",
      reasoning:
        "No response received from the Python backend. Showing demo data instead.",
      passed: false,
      timestamp,
    },
  ];

  return {
    thread_id: threadId,
    current_agent: "classification",
    context: {
      backend_status: "offline",
      notice: "Showing cached demo data because the AI backend is offline.",
      last_synced_at: timestamp,
    },
    agents,
    events,
    guardrails,
  };
}

export function buildOfflineBootstrapState() {
  return buildOfflineThreadState();
}

export function buildOfflineStateResponse(threadId: string | null) {
  return buildOfflineThreadState(threadId ?? "offline-demo-thread");
}

export function buildOfflineSimpleChatResponse(
  message: string,
  threadId?: string | null,
): OfflineSimpleChatResponse {
  const normalizedMessage = message?.trim() || "your request";
  const timestamp = new Date().toISOString();

  return {
    response:
      `I'm running in demo mode because the live AI backend is temporarily offline, ` +
      `but here's how I would normally assist with "${normalizedMessage}". ` +
      `This summarizes open project risks, upcoming deadlines, and recommended follow-up actions so you can keep moving while the backend restarts.`,
    retrieved: [
      {
        document_id: "demo-sop-042",
        chunk_index: 1,
        snippet:
          "Demo insight: Focus on electrical rough-in progress for Tower A and confirm the updated inspection date before the Friday coordination call.",
        metadata: {
          source: "offline-demo",
          captured_at: timestamp,
        },
      },
    ],
    thread_id: threadId ?? null,
    offline: true,
    notice: "offline-demo-response",
  };
}
