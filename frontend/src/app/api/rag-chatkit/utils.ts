import { NextResponse } from "next/server";

export const OFFLINE_HEADERS = { "x-rag-backend-status": "offline" } as const;

export function isBackendOfflineError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { message?: unknown; code?: unknown };
  const message =
    typeof maybeError.message === "string" ? maybeError.message : "";
  const code =
    typeof maybeError.code === "string" ? maybeError.code : undefined;
  return (
    code === "ECONNREFUSED" ||
    message.includes("fetch failed") ||
    message.includes("ECONNREFUSED")
  );
}

export function respondWithOfflinePayload<
  T extends { context?: Record<string, unknown> },
>(payload: T, reason: string) {
  return NextResponse.json(
    {
      ...payload,
      context: {
        ...payload.context,
        fallback_reason: reason,
      },
    },
    { status: 200, headers: OFFLINE_HEADERS },
  );
}
