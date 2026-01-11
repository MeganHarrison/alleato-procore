import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/commitments/[id]/restore
 * Restore a soft-deleted commitment (sets deleted_at = NULL)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First determine the type from the unified view (including deleted records)
    const { data: existing, error: fetchError } = await supabase
      .from("commitments_unified")
      .select("id, type, deleted_at")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Commitment not found" },
        { status: 404 },
      );
    }

    // Check if the commitment is actually deleted
    if (!existing.deleted_at) {
      return NextResponse.json(
        { error: "Commitment is not deleted" },
        { status: 400 },
      );
    }

    // Restore the commitment by setting deleted_at to null
    const tableName =
      existing.type === "subcontract" ? "subcontracts" : "purchase_orders";

    const { data, error } = await supabase
      .from(tableName)
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Commitment restored successfully",
      data,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal server error", message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
