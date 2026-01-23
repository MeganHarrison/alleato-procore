import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await params;
    const supabase = await createClient();

    // Get attachment metadata
    const { data: attachment, error } = await supabase
      .from("attachments")
      .select("id, file_name, url, uploaded_at, uploaded_by")
      .eq("id", attachmentId)
      .eq("attached_to_id", id)
      .eq("attached_to_table", "commitments")
      .single();

    if (error || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: attachment });
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await params;
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get attachment info first to delete from storage
    const { data: attachment, error: fetchError } = await supabase
      .from("attachments")
      .select("url, file_name")
      .eq("id", attachmentId)
      .eq("attached_to_id", id)
      .eq("attached_to_table", "commitments")
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    // Extract file path from URL for storage deletion
    // URL format: https://<project>.supabase.co/storage/v1/object/public/attachments/<path>
    const urlParts = attachment.url?.split("/attachments/");
    const filePath = urlParts && urlParts.length > 1 ? urlParts[1] : null;

    // Delete from storage if path exists
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([filePath]);

      if (storageError) {
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("attached_to_id", id)
      .eq("attached_to_table", "commitments");

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Attachment deleted successfully" });
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
