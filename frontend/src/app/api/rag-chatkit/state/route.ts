import { NextRequest, NextResponse } from "next/server";
import { buildOfflineStateResponse } from "@/lib/rag-chatkit/offline-data";
import { isBackendOfflineError, respondWithOfflinePayload } from "../utils";

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("thread_id");

  if (!threadId) {
    return NextResponse.json(
      { error: "thread_id is required" },
      { status: 400 },
    );
  }

  try {
    console.log("[RAG-ChatKit State] 🚀 Fetching state for thread:", threadId);

    const response = await fetch(
      `${PYTHON_BACKEND_URL}/rag-chatkit/state?thread_id=${threadId}`,
    );
    if (!response.ok) {
      console.warn(
        "[RAG-ChatKit State] ⚠️  Backend responded with status",
        response.status,
      );
      return respondWithOfflinePayload(
        buildOfflineStateResponse(threadId),
        `backend-status-${response.status}`,
      );
    }
    const data = await response.json();

    console.log("[RAG-ChatKit State] ✅ State data received");

    return NextResponse.json(data);
  } catch (error) {
    const err = error as Error;
    console.error(
      "[RAG-ChatKit State] ❌ Error:",
      err.message || "Unknown error",
    );

    if (isBackendOfflineError(error)) {
      console.error(
        "[RAG-ChatKit State] 🔌 Python backend not running, serving offline data.",
      );
      return respondWithOfflinePayload(
        buildOfflineStateResponse(threadId),
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
