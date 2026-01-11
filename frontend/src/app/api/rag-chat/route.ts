import { NextRequest, NextResponse } from "next/server";
import { buildOfflineSimpleChatResponse } from "@/lib/rag-chatkit/offline-data";
import { isBackendOfflineError, OFFLINE_HEADERS } from "../rag-chatkit/utils";

/**
 * Simple RAG Chat API Route
 *
 * This route proxies chat requests to the Python backend's /api/rag-chat-simple endpoint.
 * Unlike the ChatKit endpoint, this returns JSON directly (not streaming SSE).
 *
 * Used by the SimpleRagChat component as a fallback when ChatKit has CORS issues.
 */

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

interface ChatRequestBody {
  message: string;
  thread_id?: string | null;
  history?: Array<{ role: string; text: string }>;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let body: ChatRequestBody | null = null;

  try {
    body = await request.json();

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    console.log("[RAG-Chat API] Incoming request:", {
      message: body.message.substring(0, 100),
      hasHistory: !!(body.history && body.history.length > 0),
    });

    // Call the simple RAG chat endpoint (non-streaming)
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/rag-chat-simple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body.message,
        history: body.history || [],
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[RAG-Chat API] Backend error:",
        response.status,
        errorText,
      );

      const fallback = buildOfflineSimpleChatResponse(
        body.message,
        body.thread_id ?? null,
      );
      fallback.diagnostics = {
        fallback_reason: `backend-status-${response.status}`,
      };

      return NextResponse.json(fallback, {
        status: 200,
        headers: OFFLINE_HEADERS,
      });
    }

    const data = await response.json();

    console.log("[RAG-Chat API] Success in", elapsed, "ms");

    return NextResponse.json({
      response: data.response,
      retrieved: data.retrieved || [],
      thread_id: body.thread_id || null,
    });
  } catch (error: unknown) {
    const elapsed = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    console.error("[RAG-Chat API] Error after", elapsed, "ms:", errorMessage);

    // Check if backend is not running
    if (isBackendOfflineError({ code: errorCode, message: errorMessage })) {
      const fallback = buildOfflineSimpleChatResponse(
        body?.message || "",
        body?.thread_id ?? null,
      );
      fallback.diagnostics = { fallback_reason: "backend-offline" };

      return NextResponse.json(fallback, {
        status: 200,
        headers: OFFLINE_HEADERS,
      });
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
