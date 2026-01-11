import { NextResponse } from "next/server";
import { buildOfflineBootstrapState } from "@/lib/rag-chatkit/offline-data";
import { isBackendOfflineError, respondWithOfflinePayload } from "../utils";

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    console.log(
      "[RAG-ChatKit Bootstrap] 🚀 Fetching bootstrap state from Python backend...",
    );

    const response = await fetch(`${PYTHON_BACKEND_URL}/rag-chatkit/bootstrap`);
    if (!response.ok) {
      console.warn(
        "[RAG-ChatKit Bootstrap] ⚠️  Backend responded with status",
        response.status,
      );
      return respondWithOfflinePayload(
        buildOfflineBootstrapState(),
        `backend-status-${response.status}`,
      );
    }

    const data = await response.json();

    console.log("[RAG-ChatKit Bootstrap] ✅ Bootstrap data received:", {
      hasThreadId: !!data.thread_id,
      currentAgent: data.current_agent,
    });

    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    console.error(
      "[RAG-ChatKit Bootstrap] ❌ Error:",
      err.message || "Unknown error",
    );

    if (isBackendOfflineError(error)) {
      console.error(
        "[RAG-ChatKit Bootstrap] 🔌 Python backend not running, serving offline data.",
      );
      return respondWithOfflinePayload(
        buildOfflineBootstrapState(),
        "backend-offline",
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: err.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
