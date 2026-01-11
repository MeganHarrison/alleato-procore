import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Permanent Delete Commitment
 *
 * Hard deletes a commitment from the database. This action is irreversible.
 * The commitment must be soft-deleted first (deleted_at must be set).
 *
 * @route DELETE /api/commitments/[id]/permanent-delete
 * @param id - Commitment ID
 * @returns 204 No Content on success
 *
 * Business Rules:
 * - Commitment must be soft-deleted first (deleted_at IS NOT NULL)
 * - Cascades delete to related records (attachments, change orders, invoices)
 * - Determines correct table (subcontracts vs purchase_orders) from unified view
 *
 * Error Cases:
 * - 401: Unauthorized (no user session)
 * - 404: Commitment not found
 * - 400: Commitment not soft-deleted yet
 */
export async function DELETE(
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

    // First determine the type and verify it's deleted from the unified view
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

    // Verify the commitment is actually soft-deleted
    if (!existing.deleted_at) {
      return NextResponse.json(
        {
          error: "Commitment must be soft-deleted first",
          message: "Only soft-deleted commitments can be permanently deleted",
        },
        { status: 400 },
      );
    }

    // Hard delete from the appropriate table
    const tableName =
      existing.type === "subcontract" ? "subcontracts" : "purchase_orders";

    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return 204 No Content for successful deletion
    return new NextResponse(null, { status: 204 });
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
