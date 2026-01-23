import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PermissionService } from "@/services/permissionService";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

interface RouteParams {
  params: Promise<{ projectId: string; personId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, personId } = await params;
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissionService = new PermissionService(supabase);
    await permissionService.requirePermission(
      user.id,
      projectId,
      "directory",
      "write",
    );

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 },
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 2MB limit" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const dataBase64 = Buffer.from(arrayBuffer).toString("base64");

    const { error: upsertError } = await serviceSupabase
      .from("person_profile_photos")
      .upsert({
        person_id: personId,
        content_type: file.type,
        data_base64: dataBase64,
        uploaded_by: user.id,
      });

    if (upsertError) {
      throw upsertError;
    }

    await serviceSupabase
      .from("people")
      .update({ avatar_updated_at: new Date().toISOString() })
      .eq("id", personId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DirectoryAvatarUpload] Failed", error);
    return NextResponse.json(
      {
        error: "Failed to upload profile photo",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
